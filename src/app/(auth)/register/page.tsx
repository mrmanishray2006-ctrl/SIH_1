"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { QrCode, Store, User, ArrowRight, Building, CreditCard, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<"owner" | "customer">("customer");
  const [loading, setLoading] = useState(false);

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Owner specific fields
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [upiVpa, setUpiVpa] = useState("");
  const [taxRate, setTaxRate] = useState("5.0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        password,
        role,
        phone,
      };

      if (role === "owner") {
        payload.storeName = storeName;
        payload.address = address;
        payload.upiVpa = upiVpa;
        payload.taxRate = parseFloat(taxRate) || 5.0;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed. Please check the inputs.");
        setLoading(false);
        return;
      }

      toast.success("Account created successfully! Logging you in...");

      // Automatically sign in
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        toast.error("Auto login failed. Please sign in manually.");
        router.push("/login");
      } else {
        router.push(role === "owner" ? "/dashboard" : "/scan");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex flex-1 items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-lg space-y-6">
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
              <QrCode className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Join QRShop</CardTitle>
            <CardDescription>
              {role === "owner"
                ? "Open your retail store and generate self-checkout QR codes"
                : "Shop seamlessly and checkout in seconds with UPI"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs
              value={role}
              onValueChange={(val) => setRole(val as "owner" | "customer")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customer" className="gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </TabsTrigger>
                <TabsTrigger value="owner" className="gap-2">
                  <Store className="h-4 w-4" />
                  Store Owner
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Your Full Name</label>
                  <Input
                    placeholder="e.g. Rajesh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Owner Specific Store Profile Details */}
              {role === "owner" && (
                <div className="space-y-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <Store className="h-4 w-4" />
                    Store Profile Details
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      Store / Business Name
                    </label>
                    <Input
                      placeholder="e.g. Apex SuperMart & Daily"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Store Physical Address
                    </label>
                    <Input
                      placeholder="Shop 10, MG Road, Bengaluru"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        Owner UPI ID (VPA)
                      </label>
                      <Input
                        placeholder="merchant@upi"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Store Tax Rate (%)</label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="5.0"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full font-semibold shadow-md mt-2"
                disabled={loading}
              >
                {loading ? "Creating Account..." : role === "owner" ? "Create Store & Account" : "Sign Up as Customer"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground pt-2">
            <div>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
