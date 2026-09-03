"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  BarChart3,
  CreditCard,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products & QR", href: "/dashboard/products", icon: Package },
  { label: "Stock Alerts", href: "/dashboard/stock", icon: Boxes },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Sales Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { label: "Store Settings", href: "/dashboard/settings", icon: Settings },
];

export function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card/50 backdrop-blur-md hidden md:flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
        Store Management
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Customer Mode Quick Link */}
      <div className="pt-4 border-t mt-auto">
        <Link
          href="/scan"
          target="_blank"
          className="flex items-center justify-between text-xs text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <span>Open Customer Scanner</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
