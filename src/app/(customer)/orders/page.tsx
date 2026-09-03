"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, FileDown, Calendar, ArrowRight, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders || []);
        }
      } catch (e) {
        toast.error("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="container py-8 px-4 pb-20 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My Order History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            View all your completed in-store checkouts and download tax invoices
          </p>
        </div>

        <Link href="/scan">
          <Button variant="gradient" size="sm">
            Scan & Shop
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tax Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading your past orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <div className="space-y-2">
                      <p>You haven&apos;t placed any self-checkout orders yet.</p>
                      <Link href="/scan">
                        <Button variant="outline" size="sm">
                          Start Scanning Products
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-semibold text-xs text-primary">
                        <Link href={`/orders/${order.id}`} className="hover:underline">
                          {order.invoiceNumber}
                        </Link>
                      </TableCell>

                      <TableCell className="text-xs font-semibold">
                        {order.store?.storeName}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>

                      <TableCell className="text-xs">
                        {items.length} item{items.length > 1 ? "s" : ""}
                      </TableCell>

                      <TableCell className="text-xs sm:text-sm font-bold">
                        {formatCurrency(order.total)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={order.paymentStatus === "paid" ? "success" : "destructive"}
                          className="capitalize text-xs"
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <a
                          href={`/api/orders/${order.id}/invoice`}
                          download
                          className="inline-flex"
                        >
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                            <FileDown className="h-3.5 w-3.5" /> PDF
                          </Button>
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
