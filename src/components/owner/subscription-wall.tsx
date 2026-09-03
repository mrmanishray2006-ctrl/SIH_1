"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle, Sparkles, ShieldAlert, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface SubscriptionWallProps {
  isExpired: boolean;
  onRenewSuccess?: () => void;
}

export function SubscriptionWall({ isExpired, onRenewSuccess }: SubscriptionWallProps) {
  const [loading, setLoading] = useState(false);

  if (!isExpired) return null;

  const handleRenew = async (plan: "starter" | "pro" | "enterprise") => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (res.ok) {
        toast.success(`Subscription renewed to ${plan.toUpperCase()}! Dashboard unlocked.`);
        if (onRenewSuccess) onRenewSuccess();
        window.location.reload();
      } else {
        toast.error("Renewal failed. Please try again.");
      }
    } catch (e) {
      toast.error("Network error renewing subscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <Card className="max-w-xl w-full border-rose-500/50 shadow-2xl animate-in zoom-in-95">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Subscription Expired
          </CardTitle>
          <CardDescription className="text-sm">
            Your QRShop store subscription has expired. Please renew or upgrade your plan to unlock your owner dashboard, inventory controls, and order processing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border p-4 hover:border-primary transition-all">
              <div className="font-semibold text-sm">Pro Retailer</div>
              <div className="text-2xl font-bold text-primary mt-1">₹1,299<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              <ul className="text-xs text-muted-foreground space-y-1 mt-3">
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Unlimited Products & QR</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Low Stock Alerts</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> CSV Sales Export</li>
              </ul>
              <Button
                variant="gradient"
                size="sm"
                className="w-full mt-4"
                disabled={loading}
                onClick={() => handleRenew("pro")}
              >
                {loading ? "Processing..." : "Renew Pro Plan"}
              </Button>
            </div>

            <div className="rounded-xl border p-4 hover:border-primary transition-all">
              <div className="font-semibold text-sm">Starter Plan</div>
              <div className="text-2xl font-bold text-foreground mt-1">₹499<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              <ul className="text-xs text-muted-foreground space-y-1 mt-3">
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Up to 100 Products</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Razorpay UPI Checkout</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> PDF Invoices</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                disabled={loading}
                onClick={() => handleRenew("starter")}
              >
                {loading ? "Processing..." : "Renew Starter"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
