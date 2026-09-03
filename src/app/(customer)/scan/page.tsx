"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRScanner } from "@/components/customer/qr-scanner";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";

export default function CustomerScanPage() {
  const { totalCount, total } = useCart();

  return (
    <div className="container py-6 px-4 pb-28 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Scan Product & Self Checkout
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          No lines, no waiting. Scan items directly from store shelves and pay via UPI.
        </p>
      </div>

      {/* QR Scanner Component */}
      <QRScanner />

      {/* Sticky Bottom Cart Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-background/90 backdrop-blur-md border-t shadow-2xl">
          <div className="container max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {totalCount} item{totalCount > 1 ? "s" : ""} in your basket
              </p>
              <p className="text-lg font-bold text-foreground">
                Total: <span className="text-primary">{formatCurrency(total)}</span>
              </p>
            </div>

            <Link href="/cart">
              <Button size="lg" variant="gradient" className="font-semibold shadow-lg">
                View Cart <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
