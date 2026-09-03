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
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Stat cards counts
    const totalProducts = await db.product.count({
      where: { storeId: store.id, isActive: true },
    });

    const lowStockCount = await db.product.count({
      where: {
        storeId: store.id,
        stockQty: { lte: store.lowStockThreshold },
      },
    });

    const todayOrders = await db.order.findMany({
      where: {
        storeId: store.id,
        paymentStatus: "paid",
        createdAt: { gte: startOfToday },
      },
      select: { total: true },
    });
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const monthOrders = await db.order.findMany({
      where: {
        storeId: store.id,
        paymentStatus: "paid",
        createdAt: { gte: startOfMonth },
      },
      select: { total: true },
    });
    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);

    // 2. 30-Day Sales line chart time-series data
    const last30DaysOrders = await db.order.findMany({
      where: {
        storeId: store.id,
        paymentStatus: "paid",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { total: true, createdAt: true },
    });

    const chartMap = new Map<string, { date: string; label: string; sales: number; orders: number }>();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      chartMap.set(key, { date: key, label, sales: 0, orders: 0 });
    }

    last30DaysOrders.forEach((ord) => {
      const key = new Date(ord.createdAt).toISOString().split("T")[0];
      const existing = chartMap.get(key);
      if (existing) {
        existing.sales = Math.round((existing.sales + ord.total) * 100) / 100;
        existing.orders += 1;
      }
    });

    const salesChartData = Array.from(chartMap.values());

    // 3. Recent 5 orders for dashboard table
    const recentOrders = await db.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalProducts,
        todaySales,
        monthRevenue,
        lowStockCount,
        storeName: store.storeName,
        subscriptionPlan: store.subscriptionPlan,
        subscriptionStatus: store.subscriptionStatus,
      },
      salesChartData,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        items: JSON.parse(o.items),
      })),
    });
  } catch (error) {
    console.error("Error generating sales analytics:", error);
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
}
