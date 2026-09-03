"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  CreditCard,
  ShieldCheck,
  Building,
  Store,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CustomerCheckoutPage() {
  const router = useRouter();
  const { items, storeId, subtotal, taxRate, taxAmount, discount, total, promoCode, clearCart } =
    useCart();

  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [activePaymentPayload, setActivePaymentPayload] = useState<any>(null);

  // Load store details for invoice preview
  useEffect(() => {
    async function loadStore() {
      if (!storeId && items.length > 0) {
        // If storeId is missing, resolve from first item's product info
        try {
          const res = await fetch(`/api/products/${items[0].productId}`);
          const data = await res.json();
          if (data.product?.store) {
            setStoreInfo(data.product.store);
          }
        } catch (e) {
          console.error("Failed to load store for checkout", e);
        }
      } else if (storeId) {
        try {
          const res = await fetch(`/api/products?storeId=${storeId}`);
          const data = await res.json();
          if (data.products?.[0]?.storeId) {
            const pRes = await fetch(`/api/products/${data.products[0].id}`);
            const pData = await pRes.json();
            if (pData.product?.store) {
              setStoreInfo(pData.product.store);
            }
          }
        } catch (e) {
          console.error("Failed to load store info", e);
        }
      }
      setLoadingStore(false);
    }
    loadStore();
  }, [storeId, items]);

  if (items.length === 0) {
    return (
      <div className="container py-16 px-4 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-2xl font-bold">No Items to Checkout</h2>
        <p className="text-sm text-muted-foreground">
          Your cart is empty. Please scan products before proceeding to payment.
        </p>
        <Link href="/scan">
          <Button variant="gradient">Return to Scanner</Button>
        </Link>
      </div>
    );
  }

  // Handle Payment Trigger
  const handleInitiatePayment = async () => {
    setProcessingPayment(true);
    try {
      const currentStoreId = storeId || storeInfo?.id;
      if (!currentStoreId) {
        toast.error("Unable to identify retail store. Please rescan an item.");
        setProcessingPayment(false);
        return;
      }

      // 1. Create order on server
      const createRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentStoreId,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          promoCode,
        }),
      });

      const orderData = await createRes.json();

      if (!createRes.ok) {
        toast.error(orderData.error || "Failed to initialize payment.");
        setProcessingPayment(false);
        return;
      }

      setActivePaymentPayload(orderData);

      // If Razorpay live SDK is available and not in pure mock mode
      if (typeof window.Razorpay !== "undefined" && !orderData.isMock) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: orderData.orderMetadata.storeName,
          description: `QRShop Retail Checkout`,
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            await verifyAndFinalize(response, orderData.orderMetadata);
          },
          prefill: {
            name: "Shopper",
            email: "customer@qrshop.com",
            contact: "9999999999",
          },
          theme: {
            color: "#2563eb",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp: any) {
          toast.error("Payment failed: " + resp.error.description);
          setProcessingPayment(false);
        });
        rzp.open();
      } else {
        // Show Test Mode / Simulated UPI Modal for instant verification
        setShowSimulatedModal(true);
      }
    } catch (error) {
      console.error("Payment trigger error:", error);
      toast.error("An error occurred initializing payment gateway.");
      setProcessingPayment(false);
    }
  };

  // Verify signature and finalize in database
  const verifyAndFinalize = async (paymentResp: any, metadata: any) => {
    try {
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: paymentResp.razorpay_order_id,
          razorpay_payment_id: paymentResp.razorpay_payment_id,
          razorpay_signature: paymentResp.razorpay_signature,
          orderMetadata: metadata,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        toast.error(verifyData.error || "Payment verification failed.");
        setProcessingPayment(false);
        setShowSimulatedModal(false);
        return;
      }

      toast.success("Payment Successful! Generating invoice...");
      clearCart();
      router.push(`/checkout/success?orderId=${verifyData.order.id}`);
    } catch (e) {
      toast.error("Failed to verify transaction.");
      setProcessingPayment(false);
      setShowSimulatedModal(false);
    }
  };

  // Simulate Instant UPI payment in Test Mode
  const handleSimulatedPaymentSuccess = async () => {
    if (!activePaymentPayload) return;
    const simPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const simSignature = `sim_sig_${Date.now()}`;

    await verifyAndFinalize(
      {
        razorpay_order_id: activePaymentPayload.razorpayOrderId,
        razorpay_payment_id: simPaymentId,
        razorpay_signature: simSignature,
      },
      activePaymentPayload.orderMetadata
    );
  };

  return (
    <>
      {/* Razorpay Standard Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="container py-8 px-4 pb-20 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bill Preview & Checkout
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Verify your retail invoice details and complete payment via UPI
          </p>
        </div>

        {/* Store Information Card */}
        <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">
                  {storeInfo?.storeName || "SuperMart Retail"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {storeInfo?.address || "Indiranagar, Bengaluru"}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Destination UPI
              </span>
              <span className="font-mono text-xs font-semibold text-primary">
                {storeInfo?.upiVpa || "supermart@okicici"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Itemized Bill Breakdown */}
        <Card className="shadow-md">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold">Itemized Invoice Preview</CardTitle>
            <CardDescription className="text-xs">
              Official store bill generated for your basket
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3 text-xs">
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground text-sm block">
                      {item.name}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      ₹{item.price.toFixed(2)} × {item.quantity} units
                    </span>
                  </div>
                  <div className="font-bold text-sm">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Promo Discount ({promoCode})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Store GST / Tax ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>

              <div className="pt-3 border-t flex justify-between items-baseline text-foreground">
                <div>
                  <span className="text-base font-bold block">Grand Total Payable</span>
                  <span className="text-[11px] text-muted-foreground">
                    Inclusive of all applicable retail taxes
                  </span>
                </div>
                <span className="text-2xl font-black text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 flex-col gap-3">
            <Button
              variant="gradient"
              size="lg"
              className="w-full font-bold shadow-xl gap-2 text-base h-12"
              disabled={processingPayment}
              onClick={handleInitiatePayment}
            >
              <Smartphone className="h-5 w-5" />
              {processingPayment ? "Connecting to UPI..." : `Pay ${formatCurrency(total)} via UPI`}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Secured by Razorpay • UPI Intent & Instant Invoice</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Simulated UPI Checkout Modal for Test Mode */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full border-blue-500/50 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 mb-2">
                <Smartphone className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Razorpay UPI Checkout</CardTitle>
              <CardDescription className="text-xs">
                Test Mode Simulation • Paying to {storeInfo?.storeName || "Store"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="rounded-xl border p-3 bg-muted/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payable Amount:</span>
                  <span className="font-bold text-base text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination VPA:</span>
                  <span className="font-mono font-semibold">
                    {storeInfo?.upiVpa || "supermart@okicici"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Razorpay Order:</span>
                  <span className="font-mono text-[10px]">
                    {activePaymentPayload?.razorpayOrderId}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-center">
                <p className="font-semibold text-xs">
                  UPI Intent Simulation Ready
                </p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Click &apos;Approve & Pay&apos; to simulate successful UPI authentication in Google Pay / PhonePe
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-2 pt-0">
              <Button
                variant="gradient"
                className="w-full font-bold shadow-md"
                onClick={handleSimulatedPaymentSuccess}
              >
                Approve & Pay {formatCurrency(total)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowSimulatedModal(false);
                  setProcessingPayment(false);
                }}
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
