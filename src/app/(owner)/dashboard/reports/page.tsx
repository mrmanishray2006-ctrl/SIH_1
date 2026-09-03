"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Download,
  IndianRupee,
  ShoppingBag,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function OwnerReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const fetchFilteredOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?status=paid`);
      const data = await res.json();
      if (res.ok) {
        const all = data.orders || [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = all.filter((o: any) => {
          const d = new Date(o.createdAt);
          return d >= start && d <= end;
        });
        setOrders(filtered);
      }
    } catch (e) {
      toast.error("Failed to load reports data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredOrders();
  }, [startDate, endDate]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTax = orders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalSubtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

  const handleExportCsv = () => {
    window.open(
      `/api/reports/export-csv?startDate=${startDate}&endDate=${endDate}`,
      "_blank"
    );
    toast.success("Downloading CSV sales report...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Sales & Financial Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Audit store performance, analyze tax collections, and export CSV spreadsheets
          </p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={handleExportCsv}
          className="gap-1.5 shadow-sm"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export CSV Report
        </Button>
      </div>

      {/* Date Range Selection Card */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Select Report Date Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40 text-xs h-9"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchFilteredOrders}
              className="text-xs h-9"
            >
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Gross Revenue
              </p>
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Paid customer checkouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Orders
              </p>
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">{orders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Transactions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Avg Order Value (AOV)
              </p>
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(aov)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average basket size</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Taxes Collected
              </p>
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(totalTax)}</div>
            <p className="text-xs text-muted-foreground mt-1">GST/VAT for filing</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle>Period Breakdown Summary</CardTitle>
          <CardDescription>
            Performance metrics from {startDate} to {endDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border divide-y text-sm">
            <div className="flex justify-between p-4">
              <span className="text-muted-foreground">Net Product Sales (Subtotal)</span>
              <span className="font-semibold">{formatCurrency(totalSubtotal)}</span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-muted-foreground">Collected Taxes</span>
              <span className="font-semibold">{formatCurrency(totalTax)}</span>
            </div>
            <div className="flex justify-between p-4 bg-muted/30">
              <span className="font-bold text-foreground">Total Realized Revenue</span>
              <span className="font-bold text-primary">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
              <Download className="h-4 w-4" /> Download Complete CSV Dataset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
