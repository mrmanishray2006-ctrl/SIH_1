import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ items: [] });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ items: [] });
    }

    const cart = await db.cart.findUnique({
      where: {
        userId_storeId: {
          userId: session.user.id,
          storeId,
        },
      },
    });

    return NextResponse.json({
      items: cart ? JSON.parse(cart.items) : [],
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Guest cart maintained on client" });
    }

    const body = await req.json();
    const { storeId, items } = body;

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const cart = await db.cart.upsert({
      where: {
        userId_storeId: {
          userId: session.user.id,
          storeId,
        },
      },
      update: {
        items: JSON.stringify(items || []),
      },
      create: {
        userId: session.user.id,
        storeId,
        items: JSON.stringify(items || []),
      },
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Error saving cart:", error);
    return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
  }
}
