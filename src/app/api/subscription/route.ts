import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const store = await db.store.findFirst({
      where: { ownerId: session.user.id },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Check if subscription has expired based on renewalDate
    const isExpired =
      store.subscriptionStatus === "expired" ||
      (store.subscriptionRenewalDate && new Date(store.subscriptionRenewalDate) < new Date());

    return NextResponse.json({
      subscription: {
        plan: store.subscriptionPlan,
        status: isExpired ? "expired" : store.subscriptionStatus,
        renewalDate: store.subscriptionRenewalDate,
        history: store.subscriptions,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { plan } = body; // 'starter' | 'pro' | 'enterprise'

    if (!["starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 });
    }

    const store = await db.store.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const planPrices: Record<string, number> = {
      starter: 499,
      pro: 1299,
      enterprise: 2999,
    };

    const newRenewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update Store & add Subscription history record
    const [updatedStore, subRecord] = await db.$transaction([
      db.store.update({
        where: { id: store.id },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionRenewalDate: newRenewalDate,
        },
      }),
      db.subscription.create({
        data: {
          storeId: store.id,
          plan,
          amount: planPrices[plan] || 499,
          status: "active",
          startDate: new Date(),
          renewalDate: newRenewalDate,
          paymentMethod: "Razorpay UPI",
          autoRenew: true,
        },
      }),
    ]);

    return NextResponse.json({
      message: `Successfully upgraded to ${plan.toUpperCase()} plan`,
      store: updatedStore,
      subscription: subRecord,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
