"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { QrCode, Lock, Mail, ArrowRight, Store, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "customer">("customer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error || "Failed to sign in. Please check your credentials.");
      } else {
        toast.success("Welcome back!");
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (role === "owner" || email.includes("owner")) {
          router.push("/dashboard");
        } else {
          router.push("/scan");
        }
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (targetRole: "owner" | "customer") => {
    setRole(targetRole);
    if (targetRole === "owner") {
      setEmail("owner@qrshop.com");
      setPassword("password123");
      toast.info("Loaded Store Owner credentials");
    } else {
      setEmail("customer@qrshop.com");
      setPassword("password123");
      toast.info("Loaded Customer credentials");
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Quick Demo Credential Pills */}
      <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-4 text-center shadow-sm">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary mb-2.5">
          <Sparkles className="h-4 w-4" />
          <span>Instant 1-Click Demo Login</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDemoCredentials("owner")}
            className="text-xs h-9"
          >
            <Store className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
            Demo Owner
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDemoCredentials("customer")}
            className="text-xs h-9"
          >
            <User className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
            Demo Customer
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-lg">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
            <QrCode className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign In to QRShop</CardTitle>
          <CardDescription>
            Select your role and enter your account credentials
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full font-semibold shadow-md"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground pt-2">
          <div>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create one now
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container flex flex-1 items-center justify-center py-12 px-4 sm:px-6">
      <Suspense fallback={<div className="text-center py-12 text-sm text-muted-foreground">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
