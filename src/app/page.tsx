"use client";

import React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  QrCode,
  Scan,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  Store,
  User,
  CheckCircle2,
  Receipt,
  FileDown,
  BarChart3,
  Boxes,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const quickDemoLogin = async (role: "owner" | "customer") => {
    try {
      const email = role === "owner" ? "owner@qrshop.com" : "customer@qrshop.com";
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password: "password123",
      });

      if (res?.error) {
        toast.error("Demo login failed. Please register or sign in manually.");
      } else {
        toast.success(`Logged in as Demo ${role === "owner" ? "Store Owner" : "Customer"}!`);
        window.location.href = role === "owner" ? "/dashboard" : "/scan";
      }
    } catch (e) {
      toast.error("Error signing in.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-background via-blue-50/20 to-background dark:via-blue-950/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="container relative max-w-5xl mx-auto px-4 text-center space-y-8">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Generation QR Self-Checkout for Retail Stores</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
              Scan, Pay & Go.{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Zero Checkout Queues.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              QRShop empowers customers to scan product shelf tags directly on their mobile browser,
              pay instantaneously via Razorpay UPI, and walk out with verified digital tax invoices.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/scan" className="w-full sm:w-auto">
              <Button size="lg" variant="gradient" className="w-full sm:w-auto font-bold shadow-lg gap-2 text-base h-12 px-8">
                <Scan className="h-5 w-5" /> Launch In-Store Scanner
              </Button>
            </Link>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold text-base h-12 px-8 border-2">
                <Store className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" /> Owner Dashboard
              </Button>
            </Link>
          </div>

          {/* 1-Click Interactive Demo Login Bar */}
          <div className="max-w-md mx-auto pt-6">
            <div className="rounded-2xl border bg-card/80 backdrop-blur-md p-4 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                Instant One-Click Demo Access
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickDemoLogin("owner")}
                  className="text-xs font-semibold h-10 hover:bg-blue-500/10 hover:border-blue-500/50"
                >
                  <Store className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                  Owner Portal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickDemoLogin("customer")}
                  className="text-xs font-semibold h-10 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                >
                  <User className="h-4 w-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  Customer Portal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Role Feature Showcase */}
      <section className="py-16 sm:py-24 bg-muted/30 border-y">
        <div className="container max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Designed for Both Shoppers & Retailers
            </h2>
            <p className="text-sm text-muted-foreground">
              A unified omnichannel platform connecting store owners to modern mobile shoppers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Role Card */}
            <Card className="border-2 border-primary/20 shadow-md hover:shadow-xl transition-all duration-200">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge variant="success" className="text-[10px] uppercase">
                      Shopper Experience
                    </Badge>
                    <h3 className="text-xl font-bold mt-0.5">Customer Self-Checkout</h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Simply walk into the store, point your smartphone camera at product shelf QR tags,
                  and build your basket in real-time.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>In-Browser Camera Scanner:</strong> No app downloads needed. Works directly via HTML5 QR camera.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Live Cart & Taxes:</strong> Automatic GST tax breakdown and instant promo code discounts.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Razorpay UPI Checkout:</strong> 1-click payment routed straight to the merchant&apos;s verified UPI VPA.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Instant PDF Invoices:</strong> Authentic computer-generated receipts available on phone and email.</span>
                  </li>
                </ul>

                <Link href="/scan" className="block pt-2">
                  <Button variant="gradient" className="w-full font-bold gap-2">
                    Try Customer QR Scanner <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Owner Role Card */}
            <Card className="border-2 border-primary/20 shadow-md hover:shadow-xl transition-all duration-200">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge variant="default" className="text-[10px] uppercase">
                      Merchant Operations
                    </Badge>
                    <h3 className="text-xl font-bold mt-0.5">Store Owner Portal</h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Full control over your physical store inventory, automated QR shelf tag generation,
                  stock safety alerts, and revenue intelligence.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Auto-Generated QR Codes:</strong> Every created product automatically receives a high-res QR shelf tag.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Bulk PDF Label Export:</strong> Download all QR tags formatted into printable multi-column shelf label sheets.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Atomic Stock Decrement:</strong> Inventory decreases automatically with every verified payment.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>30-Day Sales Analytics & CSV:</strong> Interactive Recharts revenue trends and 1-click accounting exports.</span>
                  </li>
                </ul>

                <Link href="/dashboard" className="block pt-2">
                  <Button variant="outline" className="w-full font-bold gap-2">
                    Go to Owner Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Step-by-Step Workflow Showcase */}
      <section className="py-16 sm:py-24">
        <div className="container max-w-5xl mx-auto px-4 space-y-12 text-center">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold">How QRShop Works End-to-End</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              From physical shelf to digital receipt in 4 frictionless steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="rounded-2xl border p-5 bg-card space-y-3 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                1
              </div>
              <h4 className="font-bold text-sm">Add & Generate QR</h4>
              <p className="text-xs text-muted-foreground">
                Owner adds products. QRShop creates unique QR tags and exports printable PDF shelf labels.
              </p>
            </div>

            <div className="rounded-2xl border p-5 bg-card space-y-3 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                2
              </div>
              <h4 className="font-bold text-sm">Scan with Smartphone</h4>
              <p className="text-xs text-muted-foreground">
                Shopper opens scanner in mobile browser, points at shelf QR, and adds items to basket instantly.
              </p>
            </div>

            <div className="rounded-2xl border p-5 bg-card space-y-3 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                3
              </div>
              <h4 className="font-bold text-sm">Instant UPI Payment</h4>
              <p className="text-xs text-muted-foreground">
                Shopper verifies invoice total and completes Razorpay UPI checkout directly to the store&apos;s VPA.
              </p>
            </div>

            <div className="rounded-2xl border p-5 bg-card space-y-3 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                4
              </div>
              <h4 className="font-bold text-sm">Atomic Stock & PDF</h4>
              <p className="text-xs text-muted-foreground">
                Database decrements stock atomically, issues sequential tax invoice, and updates owner KPIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto bg-muted/20">
        <div className="container max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">QRShop Retail</span>
            <span>• Next-Gen Scan & Pay</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/scan" className="hover:text-foreground transition-colors">
              Customer Scanner
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Owner Dashboard
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
