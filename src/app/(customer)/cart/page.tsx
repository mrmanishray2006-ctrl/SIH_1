"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Tag,
  Check,
  X,
  Camera,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";

export default function CustomerCartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    taxRate,
    taxAmount,
    discount,
    total,
    promoCode,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const [inputCode, setInputCode] = useState("");

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const success = applyPromoCode(inputCode.trim());
    if (success) setInputCode("");
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 px-4 text-center max-w-md mx-auto space-y-5">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
          <p className="text-sm text-muted-foreground">
            Scan product QR codes on store shelves to add them directly to your shopping basket.
          </p>
        </div>
        <Link href="/scan">
          <Button variant="gradient" size="lg" className="w-full font-semibold shadow-md">
            <Camera className="h-5 w-5 mr-2" /> Open QR Scanner
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6 px-4 pb-20 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Shopping Basket</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Review your selected retail items and proceed to instant UPI checkout
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <Card key={item.productId} className="overflow-hidden border shadow-sm">
              <CardContent className="p-4 flex items-center gap-3 sm:gap-4">
                {/* Thumbnail */}
                <div className="h-16 w-16 relative rounded-xl overflow-hidden bg-muted shrink-0 border">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      QR
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {item.name}
                  </h3>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    SKU: {item.sku}
                  </div>
                  <div className="text-sm font-bold text-primary mt-1">
                    {formatCurrency(item.price)}
                  </div>
                </div>

                {/* Quantity Controls (min 44px tap targets) */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="h-9 w-9 rounded-lg"
                    title="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>

                  <span className="w-8 text-center text-sm font-bold">
                    {item.quantity}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="h-9 w-9 rounded-lg"
                    title="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.productId)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive ml-1"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="pt-2">
            <Link href="/scan">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Camera className="h-4 w-4" /> Scan More Items
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Summary & Calculations */}
        <div className="space-y-4">
          {/* Coupon Code Section */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Promo / Discount Code
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              {promoCode ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4" />
                    <span>Coupon &apos;{promoCode}&apos; Applied (-{formatCurrency(discount)})</span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCode} className="flex gap-2">
                  <Input
                    placeholder="e.g. SAVE10 or QR50"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="text-xs h-9 uppercase"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs shrink-0">
                    Apply
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Bill Calculation Breakdown */}
          <Card className="border shadow-md">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-base font-bold">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Store GST / Tax ({taxRate}%)</span>
                <span className="font-semibold text-foreground">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="pt-3 border-t flex justify-between items-baseline text-foreground">
                <span className="text-sm font-bold">Estimated Grand Total</span>
                <span className="text-xl font-extrabold text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
              <Link href="/checkout" className="w-full">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full font-bold shadow-lg gap-2 text-sm"
                >
                  Proceed to Bill & Pay <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
