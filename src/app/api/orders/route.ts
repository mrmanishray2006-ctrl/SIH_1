import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const isOwner = session.user.role === "owner";
    const where: any = {};

    if (isOwner) {
      const store = await db.store.findFirst({
        where: { ownerId: session.user.id },
      });
      if (!store) {
        return NextResponse.json({ orders: [] });
      }
      where.storeId = store.id;
    } else {
      where.userId = session.user.id;
    }

    if (status && status !== "all") {
      where.paymentStatus = status;
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: { name: true, email: true, phone: true },
        },
        store: {
          select: { storeName: true, address: true, taxRate: true, upiVpa: true },
        },
      },
    });

    const parsedOrders = orders.map((order) => ({
      ...order,
      items: JSON.parse(order.items),
    }));

    return NextResponse.json({ orders: parsedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
