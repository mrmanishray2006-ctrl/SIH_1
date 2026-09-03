import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const store = await db.store.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch store settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { storeName, address, taxRate, upiVpa, lowStockThreshold } = body;

    const store = await db.store.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const updated = await db.store.update({
      where: { id: store.id },
      data: {
        ...(storeName ? { storeName } : {}),
        ...(address ? { address } : {}),
        ...(taxRate !== undefined ? { taxRate: parseFloat(taxRate) } : {}),
        ...(upiVpa ? { upiVpa } : {}),
        ...(lowStockThreshold !== undefined ? { lowStockThreshold: parseInt(lowStockThreshold, 10) } : {}),
      },
    });

    return NextResponse.json({
      message: "Store profile updated successfully",
      store: updated,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update store settings" }, { status: 500 });
  }
}
