import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validations/product";
import { generateProductQRCodeDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const session = await getServerSession(authOptions);

    // If no storeId query param is provided, default to session user's store
    const targetStoreId = storeId || session?.user?.storeId;

    const where: any = {};
    if (targetStoreId) {
      where.storeId = targetStoreId;
    }
    if (activeOnly) {
      where.isActive = true;
    }
    if (category && category !== "All") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Unauthorized. Only store owners can create products." },
        { status: 403 }
      );
    }

    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json(
        { error: "No store associated with this owner account." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validated = productSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Check for unique SKU within the store
    const existingSku = await db.product.findFirst({
      where: { storeId, sku: data.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: `A product with SKU "${data.sku}" already exists in your store.` },
        { status: 409 }
      );
    }

    // 1. Create product record first to secure unique ID
    const product = await db.product.create({
      data: {
        storeId,
        name: data.name,
        price: data.price,
        sku: data.sku,
        barcode: data.barcode || null,
        stockQty: data.stockQty,
        category: data.category,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive,
      },
    });

    // 2. Auto-generate high-res QR code containing product URL/ID
    const qrCodeUrl = await generateProductQRCodeDataUrl(
      product.id,
      storeId,
      product.sku
    );

    // 3. Update product with QR code
    const updatedProduct = await db.product.update({
      where: { id: product.id },
      data: { qrCodeUrl },
    });

    return NextResponse.json(
      { message: "Product created successfully", product: updatedProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal error creating product" },
      { status: 500 }
    );
  }
}
