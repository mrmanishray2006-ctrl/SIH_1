import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "primary";
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const iconColors = {
    default: "text-muted-foreground bg-muted",
    primary: "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400",
    success: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400",
    warning: "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400",
    danger: "text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400",
  };

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("p-2.5 rounded-xl", iconColors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
