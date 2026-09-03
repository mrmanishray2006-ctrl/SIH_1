import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Package,
  IndianRupee,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Plus,
  FileDown,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/owner/stat-card";
import { SalesChart } from "@/components/owner/sales-chart";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const session = await getServerSession(authOptions);
  const store = await db.store.findFirst({
    where: { ownerId: session?.user?.id },
  });

  if (!store) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold">No Store Found</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Please contact support or sign up again as a store owner.
        </p>
      </div>
    );
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Stats
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

  // 30-Day Sales Data
  const last30Orders = await db.order.findMany({
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

  last30Orders.forEach((ord) => {
    const key = new Date(ord.createdAt).toISOString().split("T")[0];
    const item = chartMap.get(key);
    if (item) {
      item.sales = Math.round((item.sales + ord.total) * 100) / 100;
      item.orders += 1;
    }
  });

  const salesChartData = Array.from(chartMap.values());

  // Recent 5 orders
  const recentOrders = await db.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {store.storeName}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time retail overview, self-checkout transactions, and inventory alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/products">
            <Button size="sm" variant="gradient">
              <Plus className="h-4 w-4 mr-1.5" /> Add Product
            </Button>
          </Link>
          <Link href="/scan" target="_blank">
            <Button size="sm" variant="outline">
              Open Scanner <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Products"
          value={totalProducts}
          description="Available for QR scan"
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(todaySales)}
          description={`${todayOrders.length} orders processed`}
          icon={IndianRupee}
          variant="success"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(monthRevenue)}
          description="Current calendar month"
          icon={Calendar}
          variant="default"
        />
        <StatCard
          title="Low-Stock Items"
          value={lowStockCount}
          description={`<= ${store.lowStockThreshold} units threshold`}
          icon={AlertTriangle}
          variant={lowStockCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Low Stock Banner Alert */}
      {lowStockCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">
                Inventory Warning: {lowStockCount} items are running low on stock!
              </p>
              <p className="text-xs text-muted-foreground">
                Restock now to avoid missed customer checkout scans.
              </p>
            </div>
          </div>
          <Link href="/dashboard/stock">
            <Button size="sm" variant="outline" className="shrink-0">
              Restock Items
            </Button>
          </Link>
        </div>
      )}

      {/* 30-Day Sales Chart */}
      <SalesChart data={salesChartData} />

      {/* Recent Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Customer Orders</CardTitle>
            <CardDescription>Latest self-checkout transactions</CardDescription>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm">
              View All Orders <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No orders placed yet. Test by scanning a product QR code!
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => {
                  const items = JSON.parse(order.items);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium text-xs">
                        {order.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold">{order.user.name}</div>
                        <div className="text-[11px] text-muted-foreground">{order.user.email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {items.length} item{items.length > 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="font-semibold text-xs">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.paymentStatus === "paid"
                              ? "success"
                              : order.paymentStatus === "pending"
                              ? "warning"
                              : "destructive"
                          }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`/api/orders/${order.id}/invoice`}
                          download
                          className="inline-flex items-center text-xs text-primary hover:underline"
                        >
                          <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
