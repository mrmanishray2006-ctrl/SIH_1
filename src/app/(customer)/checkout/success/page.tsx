"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  FileDown,
  Camera,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (res.ok && data.order) {
          setOrder(data.order);
        }
      } catch (e) {
        console.error("Failed to load confirmed order", e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  return (
    <Card className="border-emerald-500/30 shadow-xl overflow-hidden text-center">
      {/* Top Header Glow */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 animate-in zoom-in">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-black">Payment Confirmed!</h1>
        <p className="text-xs text-white/80 mt-1">
          Thank you for shopping. Your self-checkout receipt is ready.
        </p>
      </div>

      <CardContent className="p-6 space-y-4 text-xs">
        {loading ? (
          <div className="py-6 text-muted-foreground">Loading order details...</div>
        ) : order ? (
          <div className="space-y-3">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span className="font-mono font-bold text-foreground">
                  {order.invoiceNumber}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Store:</span>
                <span className="font-semibold text-foreground">
                  {order.store?.storeName}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction Ref:</span>
                <span className="font-mono text-[11px] text-foreground">
                  {order.transactionRef}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="text-foreground">{formatDate(order.createdAt)}</span>
              </div>

              <div className="pt-2 border-t flex justify-between items-baseline font-bold text-sm">
                <span>Amount Paid:</span>
                <span className="text-base text-primary">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            {/* Download PDF button */}
            <a
              href={`/api/orders/${order.id}/invoice`}
              download
              className="block w-full"
            >
              <Button variant="gradient" size="lg" className="w-full font-bold shadow-md gap-2">
                <FileDown className="h-5 w-5" /> Download Tax Invoice (PDF)
              </Button>
            </a>
          </div>
        ) : (
          <div className="py-4 text-muted-foreground">
            Order reference verified. Your items and inventory have been updated.
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-2 border-t">
        <Link href="/scan" className="w-full">
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Camera className="h-4 w-4" /> Scan More Products
          </Button>
        </Link>
        <Link href="/orders" className="w-full">
          <Button variant="ghost" size="sm" className="w-full gap-1.5">
            <ShoppingBag className="h-4 w-4" /> View Order History
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="container py-12 px-4 max-w-lg mx-auto space-y-6">
      <Suspense fallback={<div className="text-center py-12 text-sm text-muted-foreground">Loading order details...</div>}>
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  );
}
