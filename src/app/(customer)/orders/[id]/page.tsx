"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileDown,
  ArrowLeft,
  Store,
  CreditCard,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SingleOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (res.ok && data.order) {
          setOrder(data.order);
        } else {
          toast.error("Order not found");
        }
      } catch (e) {
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-16 text-center text-sm text-muted-foreground">
        Loading invoice details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 pb-20 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>

        <a href={`/api/orders/${order.id}/invoice`} download>
          <Button variant="gradient" size="sm" className="gap-1.5">
            <FileDown className="h-4 w-4" /> Download PDF Receipt
          </Button>
        </a>
      </div>

      <Card className="shadow-lg border">
        <CardHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Official Receipt
              </span>
              <CardTitle className="font-mono text-xl sm:text-2xl mt-1">
                {order.invoiceNumber}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Issued on {formatDate(order.createdAt)}
              </CardDescription>
            </div>

            <Badge
              variant={order.paymentStatus === "paid" ? "success" : "destructive"}
              className="text-xs uppercase px-2.5 py-1"
            >
              {order.paymentStatus}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 text-xs">
          {/* Merchant & Customer Info */}
          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border">
            <div>
              <span className="text-muted-foreground block font-medium">Merchant:</span>
              <span className="font-bold text-sm text-foreground block mt-0.5">
                {order.store?.storeName}
              </span>
              <span className="text-muted-foreground block">{order.store?.address}</span>
              <span className="text-muted-foreground block">UPI: {order.store?.upiVpa}</span>
            </div>

            <div>
              <span className="text-muted-foreground block font-medium">Payment Reference:</span>
              <span className="font-mono font-semibold text-foreground block mt-0.5">
                {order.transactionRef || "N/A"}
              </span>
              <span className="text-muted-foreground block">Method: Razorpay UPI</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
              Purchased Items
            </span>
            <div className="border rounded-xl divide-y">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3.5">
                  <div>
                    <span className="font-semibold text-sm text-foreground block">
                      {item.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ₹{item.price?.toFixed(2)} × {item.quantity} units
                    </span>
                  </div>
                  <span className="font-bold text-sm">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Store Tax ({order.store?.taxRate ?? 5}%)</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>

            <div className="flex justify-between items-baseline text-base font-black text-foreground pt-3 border-t">
              <span>Total Paid</span>
              <span className="text-xl text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
