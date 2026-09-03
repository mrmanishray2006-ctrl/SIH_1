"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { QrCode, ShoppingCart, Store, User, LogOut, LayoutDashboard, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/context/cart-context";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { totalCount } = useCart();

  const isOwner = session?.user?.role === "owner";
  const isCustomer = session?.user?.role === "customer";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md transition-all">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight flex items-center gap-1.5">
              QRShop
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                Pro
              </span>
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Scan & Pay Retail
            </span>
          </div>
        </Link>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {isOwner ? (
            <>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-primary ${
                  pathname === "/dashboard" ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/products"
                className={`transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/products") ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Products & QR
              </Link>
              <Link
                href="/dashboard/stock"
                className={`transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/stock") ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Stock Alerts
              </Link>
              <Link
                href="/dashboard/orders"
                className={`transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/orders") ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Orders
              </Link>
              <Link
                href="/dashboard/reports"
                className={`transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/reports") ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Reports
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/scan"
                className={`transition-colors hover:text-primary ${
                  pathname === "/scan" ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                QR Scanner
              </Link>
              <Link
                href="/orders"
                className={`transition-colors hover:text-primary ${
                  pathname === "/orders" ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Order History
              </Link>
            </>
          )}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart Icon (visible for customer or public) */}
          <Link href="/cart">
            <Button variant="outline" size="icon" className="relative rounded-full" title="Shopping Cart">
              <ShoppingCart className="h-5 w-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white animate-in zoom-in">
                  {totalCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User Session menu or Auth Links */}
          {session ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-semibold">{session.user.name}</span>
                <Badge variant={isOwner ? "default" : "secondary"} className="text-[10px] uppercase py-0 px-1.5">
                  {session.user.role}
                </Badge>
              </div>

              {isOwner ? (
                <Link href="/dashboard" className="sm:hidden">
                  <Button size="icon" variant="ghost">
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/orders" className="sm:hidden">
                  <Button size="icon" variant="ghost">
                    <History className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" variant="gradient">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
