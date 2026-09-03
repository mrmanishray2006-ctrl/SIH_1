"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  FileDown,
  Eye,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/orders${query}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (e) {
      toast.error("Failed to load store orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.invoiceNumber.toLowerCase().includes(term) ||
      o.user?.name.toLowerCase().includes(term) ||
      o.user?.email.toLowerCase().includes(term) ||
      (o.transactionRef && o.transactionRef.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Orders & Transactions
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track customer self-checkout orders, payment references, and digital invoices
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number, customer name, email, or txn ref..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "paid", "pending", "failed", "refunded"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs capitalize shrink-0"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-semibold text-xs text-primary">
                        {order.invoiceNumber}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold">{order.user?.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {order.user?.email}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        {items.reduce((s: number, i: any) => s + (i.quantity || 1), 0)} items
                      </TableCell>

                      <TableCell className="text-xs sm:text-sm font-bold">
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
                          className="capitalize text-xs"
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveOrder(order)}
                            className="h-8 text-xs gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>

                          <a
                            href={`/api/orders/${order.id}/invoice`}
                            download
                            className="inline-flex"
                          >
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                              <FileDown className="h-3.5 w-3.5" /> PDF
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={Boolean(activeOrder)} onOpenChange={(open) => !open && setActiveOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="font-mono text-lg">
                {activeOrder?.invoiceNumber}
              </DialogTitle>
              <Badge
                variant={
                  activeOrder?.paymentStatus === "paid"
                    ? "success"
                    : activeOrder?.paymentStatus === "pending"
                    ? "warning"
                    : "destructive"
                }
              >
                {activeOrder?.paymentStatus?.toUpperCase()}
              </Badge>
            </div>
            <DialogDescription>
              Ordered on {activeOrder && formatDate(activeOrder.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {activeOrder && (
            <div className="space-y-4 pt-2">
              {/* Customer & Transaction Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-xl border">
                <div>
                  <span className="text-muted-foreground block">Customer:</span>
                  <span className="font-semibold text-foreground">{activeOrder.user?.name}</span>
                  <span className="block text-muted-foreground">{activeOrder.user?.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Payment Reference:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {activeOrder.transactionRef || "N/A"}
                  </span>
                  <span className="block text-muted-foreground">UPI: {activeOrder.upiVpa || "Direct UPI"}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Purchased Items
                </div>
                <div className="border rounded-xl divide-y">
                  {activeOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-muted-foreground">
                          ₹{item.price?.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-bold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="space-y-1.5 pt-2 border-t text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(activeOrder.subtotal)}</span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(activeOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({activeOrder.store?.taxRate ?? 5}%)</span>
                  <span>{formatCurrency(activeOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatCurrency(activeOrder.total)}</span>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <a
                  href={`/api/orders/${activeOrder.id}/invoice`}
                  download
                  className="w-full sm:w-auto"
                >
                  <Button variant="gradient" size="sm" className="w-full gap-1.5">
                    <FileDown className="h-4 w-4" /> Download Official PDF Invoice
                  </Button>
                </a>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
