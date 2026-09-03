"use client";

import React, { useState, useEffect } from "react";
import { Store, MapPin, CreditCard, Percent, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function OwnerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [taxRate, setTaxRate] = useState("5.0");
  const [upiVpa, setUpiVpa] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/store/settings");
        const data = await res.json();
        if (res.ok && data.store) {
          setStoreName(data.store.storeName);
          setAddress(data.store.address);
          setTaxRate(String(data.store.taxRate));
          setUpiVpa(data.store.upiVpa);
          setLowStockThreshold(String(data.store.lowStockThreshold));
        }
      } catch (e) {
        toast.error("Failed to load store settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/store/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          address,
          taxRate,
          upiVpa,
          lowStockThreshold,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Store profile and UPI payment routing updated!");
      } else {
        toast.error(data.error || "Failed to update store settings");
      }
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Store Settings & Configuration
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure business details, GST/tax rates, and destination UPI payment addresses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchant Profile & Billing Information</CardTitle>
          <CardDescription>
            These details appear directly on all customer tax invoices and UPI checkout screens
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                Store Business Name
              </label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Physical Address
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  Owner UPI VPA Address (for Payments)
                </label>
                <Input
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="merchant@okaxis"
                  required
                />
                <span className="text-[11px] text-muted-foreground block">
                  All customer UPI transactions are routed to this VPA
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  Store Tax Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  required
                />
                <span className="text-[11px] text-muted-foreground block">
                  Applied to subtotal automatically during customer checkout
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold">
                Low-Stock Warning Level (Units)
              </label>
              <Input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-32"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t pt-4">
            <Button type="submit" variant="gradient" disabled={saving || loading}>
              {saving ? "Saving Changes..." : "Save Settings"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
