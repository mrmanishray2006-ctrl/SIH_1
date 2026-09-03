"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AlertTriangle, Plus, Minus, Check, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ProductType } from "@/types";

export default function OwnerStockPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<number>(5);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (e) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockDelta = async (id: string, delta: number) => {
    const currentProd = products.find((p) => p.id === id);
    if (!currentProd) return;

    const newStock = Math.max(0, currentProd.stockQty + delta);
    setUpdatingId(id);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQty: newStock }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stockQty: newStock } : p))
        );
        toast.success(`Stock updated: ${currentProd.name} (${newStock} units)`);
      } else {
        toast.error("Failed to update stock");
      }
    } catch (e) {
      toast.error("Network error updating stock");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDirectStockChange = async (id: string, value: string) => {
    const val = parseInt(value, 10);
    if (isNaN(val) || val < 0) return;

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQty: val }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stockQty: val } : p))
        );
        toast.success(`Stock updated to ${val} units`);
      }
    } catch (e) {
      toast.error("Failed to update stock");
    } finally {
      setUpdatingId(null);
    }
  };

  const lowStockItems = products.filter((p) => p.stockQty <= threshold);
  const displayedProducts = filterLowStock ? lowStockItems : products;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Inventory & Stock Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Monitor product levels in real-time, adjust units, and set warning thresholds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Threshold Configuration & Filter Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-2">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Low-Stock Alert Level</p>
                <p className="text-xs text-muted-foreground">
                  Products with units at or below this threshold trigger alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-semibold">Threshold:</label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center h-9"
              />
              <span className="text-xs text-muted-foreground">units</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Alert Filter</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {lowStockItems.length} items low
              </p>
            </div>

            <Button
              variant={filterLowStock ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterLowStock(!filterLowStock)}
              className="text-xs"
            >
              {filterLowStock ? "Show All" : "Filter Low Stock"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stock Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterLowStock ? `Low-Stock Products (${lowStockItems.length})` : "All Store Inventory"}
          </CardTitle>
          <CardDescription>
            Click +/- to quickly adjust inventory count or enter numbers directly
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Current Level</TableHead>
                <TableHead className="text-right">Quick Stock Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading inventory...
                  </TableCell>
                </TableRow>
              ) : displayedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {filterLowStock
                      ? "Great news! All products are safely stocked above the threshold."
                      : "No products in store."}
                  </TableCell>
                </TableRow>
              ) : (
                displayedProducts.map((prod) => {
                  const isLow = prod.stockQty <= threshold;
                  const isOut = prod.stockQty === 0;

                  return (
                    <TableRow key={prod.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 relative rounded-lg overflow-hidden bg-muted shrink-0 border">
                            {prod.imageUrl ? (
                              <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                QR
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-xs sm:text-sm text-foreground">
                              {prod.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {prod.sku}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {prod.category}
                      </TableCell>

                      <TableCell className="text-xs sm:text-sm font-semibold">
                        {formatCurrency(prod.price)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={isOut ? "destructive" : isLow ? "warning" : "outline"}
                          className="text-xs"
                        >
                          {isOut ? "OUT OF STOCK" : `${prod.stockQty} Units Left`}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={updatingId === prod.id || prod.stockQty === 0}
                            onClick={() => handleStockDelta(prod.id, -1)}
                            className="h-8 w-8 rounded-lg"
                            title="Decrement 1 unit"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>

                          <input
                            type="number"
                            defaultValue={prod.stockQty}
                            key={prod.stockQty}
                            onBlur={(e) => handleDirectStockChange(prod.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleDirectStockChange(prod.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className="w-14 text-center text-xs font-bold border rounded-lg h-8 bg-background focus:ring-1 focus:ring-primary"
                          />

                          <Button
                            variant="outline"
                            size="icon"
                            disabled={updatingId === prod.id}
                            onClick={() => handleStockDelta(prod.id, 1)}
                            className="h-8 w-8 rounded-lg"
                            title="Increment 1 unit"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={updatingId === prod.id}
                            onClick={() => handleStockDelta(prod.id, 10)}
                            className="h-8 text-xs font-semibold px-2"
                            title="Add 10 units"
                          >
                            +10
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
