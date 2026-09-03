import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validations/product";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    let product = await db.product.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            address: true,
            taxRate: true,
            upiVpa: true,
          },
        },
      },
    });

    // Fallback: look up by SKU or Barcode if not found by primary ID
    if (!product) {
      product = await db.product.findFirst({
        where: {
          OR: [
            { sku: id },
            { barcode: id },
          ],
        },
        include: {
          store: {
            select: {
              id: true,
              storeName: true,
              address: true,
              taxRate: true,
              upiVpa: true,
            },
          },
        },
      });
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    // Verify ownership
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing || existing.storeId !== session.user.storeId) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 404 }
      );
    }

    // Support partial updates (like inline stock adjustments or isActive toggle)
    if (body.stockQty !== undefined && Object.keys(body).length <= 2) {
      const updated = await db.product.update({
        where: { id },
        data: {
          stockQty: Math.max(0, parseInt(body.stockQty, 10)),
          ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        },
      });
      return NextResponse.json({ product: updated });
    }

    const validated = productSchema.partial().safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await db.product.update({
      where: { id },
      data: validated.data,
    });

    return NextResponse.json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing || existing.storeId !== session.user.storeId) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 404 }
      );
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
