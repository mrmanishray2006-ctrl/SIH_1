"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  QrCode,
  Download,
  Trash2,
  Edit,
  Eye,
  Check,
  AlertCircle,
  FileDown,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { ProductType } from "@/types";

export default function OwnerProductsPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Selection for bulk QR export
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<ProductType | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [stockQty, setStockQty] = useState("10");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Load products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        toast.error(data.error || "Failed to load products");
      }
    } catch (e) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Image file size must be less than 4MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit new product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          sku,
          barcode: barcode || undefined,
          stockQty: parseInt(stockQty, 10) || 0,
          category,
          description: description || undefined,
          imageUrl: imageBase64 || undefined,
          isActive: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create product");
      } else {
        toast.success("Product created with QR code!", {
          description: `${data.product.name} is now ready for scanning.`,
        });
        setIsAddOpen(false);
        // Reset form
        setName("");
        setPrice("");
        setSku("");
        setBarcode("");
        setStockQty("10");
        setCategory("General");
        setDescription("");
        setImageBase64(null);
        fetchProducts();
      }
    } catch (error) {
      toast.error("An error occurred while creating product");
    } finally {
      setSavingProduct(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
        );
        toast.success(`Product ${!current ? "activated" : "deactivated"}`);
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product deleted successfully");
      }
    } catch (e) {
      toast.error("Failed to delete product");
    }
  };

  // Bulk QR Export as PDF
  const handleBulkExportPdf = async () => {
    const idsToExport = selectedIds.length > 0 ? selectedIds : products.map((p) => p.id);
    if (idsToExport.length === 0) {
      toast.error("No products available to export.");
      return;
    }

    setExportingPdf(true);
    try {
      const res = await fetch("/api/products/export-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: idsToExport }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `QRShop-Shelf-Labels-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Exported ${idsToExport.length} QR labels to PDF!`);
      } else {
        toast.error("Failed to generate PDF labels");
      }
    } catch (e) {
      toast.error("Error generating PDF labels");
    } finally {
      setExportingPdf(false);
    }
  };

  // Filter products
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Product Catalog & QR Codes
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage store inventory, auto-generated shelf QR labels, and bulk PDF exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkExportPdf}
            disabled={exportingPdf || products.length === 0}
            className="gap-1.5"
          >
            <FileDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {exportingPdf
              ? "Generating PDF..."
              : selectedIds.length > 0
              ? `Export ${selectedIds.length} Selected (PDF)`
              : "Export All QR Labels (PDF)"}
          </Button>

          <Button
            size="sm"
            variant="gradient"
            onClick={() => setIsAddOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add New Product
          </Button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, SKU, or category..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((prod) => {
                  const isLowStock = prod.stockQty <= 5;
                  const isSelected = selectedIds.includes(prod.id);

                  return (
                    <TableRow key={prod.id} className={isSelected ? "bg-primary/5" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedIds((prev) =>
                              prev.includes(prod.id)
                                ? prev.filter((i) => i !== prod.id)
                                : [...prev, prod.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 relative rounded-lg overflow-hidden bg-muted shrink-0 border">
                            {prod.imageUrl ? (
                              <Image
                                src={prod.imageUrl}
                                alt={prod.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                                QR
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-xs sm:text-sm text-foreground">
                              {prod.name}
                            </div>
                            {prod.description && (
                              <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                                {prod.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {prod.category}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {prod.sku}
                      </TableCell>

                      <TableCell className="font-semibold text-xs sm:text-sm">
                        {formatCurrency(prod.price)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={isLowStock ? "warning" : "outline"} className="text-xs">
                          {prod.stockQty} in stock
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {prod.qrCodeUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewProduct(prod)}
                            className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/10"
                          >
                            <QrCode className="h-4 w-4" /> View QR
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Generating...</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(prod.id, prod.isActive)}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                            prod.isActive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground line-through"
                          }`}
                        >
                          {prod.isActive ? "Active" : "Disabled"}
                        </button>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter product specs. A unique QR code linked to your store will be automatically generated upon creation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Product Name</label>
              <Input
                placeholder="e.g. Organic Wildflower Honey 500g"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Price (INR ₹)</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="299"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Initial Stock Qty</label>
                <Input
                  type="number"
                  placeholder="20"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">SKU / Item Code</label>
                <Input
                  placeholder="HNY-500"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Category</label>
                <Input
                  placeholder="Pantry"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Barcode (Optional)</label>
              <Input
                placeholder="8901030381007"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Description</label>
              <Input
                placeholder="Short customer-facing description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Product Image</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer text-xs"
                />
                {imageBase64 && (
                  <div className="h-10 w-10 relative rounded border overflow-hidden shrink-0">
                    <img
                      src={imageBase64}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={savingProduct}>
                {savingProduct ? "Saving & Generating QR..." : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product QR Code Preview Modal */}
      <Dialog
        open={Boolean(previewProduct)}
        onOpenChange={(open) => !open && setPreviewProduct(null)}
      >
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>{previewProduct?.name}</DialogTitle>
            <DialogDescription>
              SKU: {previewProduct?.sku} | {previewProduct && formatCurrency(previewProduct.price)}
            </DialogDescription>
          </DialogHeader>

          {previewProduct?.qrCodeUrl && (
            <div className="my-3 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border shadow-inner">
              <img
                src={previewProduct.qrCodeUrl}
                alt={`QR code for ${previewProduct.name}`}
                className="h-56 w-56 object-contain"
              />
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                Scan with QRShop customer app to add to cart
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {previewProduct?.qrCodeUrl && (
              <a
                href={previewProduct.qrCodeUrl}
                download={`QR-${previewProduct.sku}.png`}
                className="w-full"
              >
                <Button variant="gradient" size="sm" className="w-full gap-2">
                  <Download className="h-4 w-4" /> Download PNG
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setPreviewProduct(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
