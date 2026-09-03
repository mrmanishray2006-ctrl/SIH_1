"use client";

import React, { useState, useEffect } from "react";
import { Check, CreditCard, Sparkles, Shield, Clock, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 499,
    description: "Ideal for small convenience shops and single-counter kiosks",
    features: [
      "Up to 100 Products with QR Codes",
      "Razorpay UPI Checkout Integration",
      "Instant PDF Customer Receipts",
      "Basic Sales Overview",
      "Email Support",
    ],
  },
  {
    id: "pro",
    name: "Pro Retailer",
    price: 1299,
    popular: true,
    description: "Perfect for bustling retail stores, supermarkets, and apparel shops",
    features: [
      "Unlimited Products & QR Shelf Labels",
      "Bulk QR PDF Shelf Tag Export",
      "Low-Stock Automated Alerts",
      "CSV Sales & Tax Reporting",
      "Priority Razorpay UPI Settlement",
      "24/7 Dedicated Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Multi-Store",
    price: 2999,
    description: "For multi-outlet franchises and enterprise retail chains",
    features: [
      "Everything in Pro",
      "Multi-Store Outlets Management",
      "Custom Branded Invoices & Domain",
      "ERP / Tally Inventory Webhook Sync",
      "Dedicated Account Manager",
      "99.9% Uptime SLA",
    ],
  },
];

export default function OwnerSubscriptionPage() {
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscription");
      const data = await res.json();
      if (res.ok) {
        setSubData(data.subscription);
      }
    } catch (e) {
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgradingPlan(planId);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Subscribed to ${planId.toUpperCase()}!`);
        fetchSubscription();
      } else {
        toast.error(data.error || "Subscription upgrade failed");
      }
    } catch (e) {
      toast.error("Failed to connect to subscription payment gateway");
    } finally {
      setUpgradingPlan(null);
    }
  };

  const currentPlan = subData?.plan || "starter";
  const status = subData?.status || "active";
  const renewalDate = subData?.renewalDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Subscription & Billing
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your QRShop business tier, auto-renewal settings, and payment history
        </p>
      </div>

      {/* Current Plan Overview Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Tier
                </span>
                <Badge
                  variant={
                    status === "active" ? "success" : status === "expired" ? "destructive" : "warning"
                  }
                  className="capitalize"
                >
                  {status}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold capitalize text-foreground">
                {currentPlan} Plan
              </h2>
              {renewalDate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                  <Clock className="h-3.5 w-3.5" />
                  Renewal Date: <span className="font-semibold text-foreground">{formatDate(renewalDate)}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 text-xs">
                Auto-Renew via UPI Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Tiers */}
      <div>
        <h3 className="text-lg font-bold mb-4">Available Subscription Plans</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan.toLowerCase() === p.id;

            return (
              <Card
                key={p.id}
                className={`relative flex flex-col transition-all duration-200 hover:shadow-lg ${
                  p.popular ? "border-primary shadow-md" : ""
                } ${isCurrent ? "ring-2 ring-primary bg-primary/[0.02]" : ""}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{p.name}</CardTitle>
                    {isCurrent && (
                      <Badge variant="success" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs min-h-[32px]">
                    {p.description}
                  </CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-extrabold text-foreground">
                      ₹{p.price}
                    </span>
                    <span className="text-xs text-muted-foreground">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-2.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Features Included:
                  </div>
                  <ul className="space-y-2 text-xs">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4 border-t">
                  <Button
                    variant={isCurrent ? "outline" : p.popular ? "gradient" : "default"}
                    className="w-full font-semibold"
                    disabled={isCurrent || upgradingPlan === p.id}
                    onClick={() => handleUpgrade(p.id)}
                  >
                    {upgradingPlan === p.id
                      ? "Processing..."
                      : isCurrent
                      ? "Active Plan"
                      : `Switch to ${p.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Subscription History */}
      {subData?.history && subData.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              {subData.history.map((sub: any) => (
                <div key={sub.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold capitalize text-foreground">
                      {sub.plan} Plan
                    </div>
                    <div className="text-muted-foreground">
                      Billed on {formatDate(sub.startDate)} • {sub.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{sub.amount.toFixed(2)}</div>
                    <Badge variant="success" className="text-[10px]">
                      {sub.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
