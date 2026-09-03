"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  Sparkles,
  Search,
  CheckCircle2,
  Package,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCart } from "@/context/cart-context";

interface QRScannerProps {
  onScanSuccess?: (productId: string) => void;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  const { addItem } = useCart();
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [sampleProducts, setSampleProducts] = useState<any[]>([]);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Load sample products for instant 1-click test scanning
  useEffect(() => {
    async function loadSamples() {
      try {
        const res = await fetch("/api/products?activeOnly=true");
        const data = await res.json();
        if (res.ok && data.products) {
          setSampleProducts(data.products.slice(0, 6));
        }
      } catch (e) {
        console.error("Failed to load sample products", e);
      }
    }
    loadSamples();
  }, []);

  // Process decoded QR payload
  const handleDecodedText = async (decodedText: string) => {
    try {
      let productId = decodedText.trim();

      // If payload is a full URL (e.g. http://localhost:3000/scan?productId=123&storeId=456)
      if (productId.includes("productId=")) {
        const url = new URL(productId);
        productId = url.searchParams.get("productId") || productId;
      } else if (productId.startsWith("{")) {
        // If payload is JSON
        const parsed = JSON.parse(productId);
        productId = parsed.productId || productId;
      }

      await fetchAndAddToCart(productId);
    } catch (e) {
      console.error("Error processing QR text:", e);
      toast.error("Unrecognized QR format.");
    }
  };

  const fetchAndAddToCart = async (identifier: string) => {
    setLoadingCode(true);
    try {
      // Identifier can be productId or SKU
      const res = await fetch(`/api/products/${identifier}`);
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          addItem(data.product, 1);
          if (onScanSuccess) onScanSuccess(data.product.id);
          return;
        }
      }

      // If not found by ID, try searching by SKU
      const searchRes = await fetch(`/api/products?search=${encodeURIComponent(identifier)}`);
      const searchData = await searchRes.json();
      if (searchRes.ok && searchData.products?.length > 0) {
        const product = searchData.products[0];
        addItem(product, 1);
        if (onScanSuccess) onScanSuccess(product.id);
      } else {
        toast.error("Product not found in this store.");
      }
    } catch (e) {
      toast.error("Failed to scan product.");
    } finally {
      setLoadingCode(false);
    }
  };

  // Start HTML5 Camera Scanner
  const startScanner = () => {
    setCameraError(null);
    setScannerActive(true);

    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          "qr-reader-container",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true,
          },
          false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            handleDecodedText(decodedText);
          },
          (error) => {
            // Ignore benign frame scan errors
          }
        );
      } catch (err: any) {
        console.error("Camera scanner error:", err);
        setCameraError(err.message || "Unable to access device camera.");
        setScannerActive(false);
      }
    }, 200);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Live Camera Scanner Box */}
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Live In-Store QR Scanner
          </CardTitle>
          <CardDescription>
            Point your camera at any product shelf QR label to instantly add it to your basket
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 flex flex-col items-center">
          {scannerActive ? (
            <div className="w-full space-y-3">
              <div
                id="qr-reader-container"
                className="w-full overflow-hidden rounded-xl bg-black border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={stopScanner}
              >
                <CameraOff className="h-4 w-4 mr-2" /> Turn Off Camera
              </Button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center py-8 px-4 text-center border-2 border-dashed rounded-xl bg-muted/30">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Camera className="h-8 w-8" />
              </div>
              <p className="font-semibold text-sm">Ready to scan items</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Tap below to enable your camera and scan product QR tags in the store
              </p>

              {cameraError && (
                <p className="text-xs text-destructive mt-2">{cameraError}</p>
              )}

              <Button
                variant="gradient"
                size="lg"
                className="mt-5 w-full max-w-xs font-semibold shadow-md"
                onClick={startScanner}
              >
                <Camera className="h-5 w-5 mr-2" /> Start Camera Scanner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Code Entry */}
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) {
                fetchAndAddToCart(manualCode.trim());
                setManualCode("");
              }
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Enter product SKU (e.g. TEA-001) or barcode..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="text-xs h-10"
            />
            <Button
              type="submit"
              variant="secondary"
              className="h-10 text-xs shrink-0"
              disabled={loadingCode || !manualCode.trim()}
            >
              {loadingCode ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 1-Click Test Simulator for Verification */}
      <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            Instant Scan Simulator (Test Without Camera)
          </div>
          <CardDescription className="text-xs">
            Click any shelf item below to simulate scanning its physical QR code:
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {sampleProducts.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => fetchAndAddToCart(prod.id)}
                className="flex items-center justify-between p-2.5 rounded-xl border bg-background hover:border-primary text-left transition-all group shadow-sm"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-xs truncate group-hover:text-primary">
                    {prod.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    ₹{prod.price.toFixed(2)} • {prod.sku}
                  </div>
                </div>
                <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
