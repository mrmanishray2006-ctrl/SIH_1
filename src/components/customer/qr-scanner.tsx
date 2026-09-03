"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  Sparkles,
  Search,
  CheckCircle2,
  Package,
  Upload,
  RefreshCw,
  Zap,
  ZapOff,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";

interface QRScannerProps {
  onScanSuccess?: (productId: string) => void;
  autoScanId?: string;
}

// Audio beep + haptic feedback
function triggerScanFeedback() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    }
  } catch {
    // AudioContext blocked or not supported
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(100);
    } catch {
      // Vibration not permitted
    }
  }
}

// Safely extract product ID, SKU, or barcode from any QR payload
function extractIdentifier(rawText: string): string {
  const trimmed = rawText.trim();

  // 1. JSON payload: {"productId": "..."} or {"sku": "..."}
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.productId || parsed.id || parsed.sku || parsed.barcode || trimmed;
    } catch {
      // Not valid JSON, continue
    }
  }

  // 2. URL or query string with productId= or sku=
  if (trimmed.includes("productId=") || trimmed.includes("sku=")) {
    try {
      const url = new URL(trimmed, "https://internal.qrshop");
      const pId = url.searchParams.get("productId");
      if (pId) return pId;
      const sku = url.searchParams.get("sku");
      if (sku) return sku;
    } catch {
      const match = trimmed.match(/[?&](productId|sku)=([^&]+)/);
      if (match) return decodeURIComponent(match[2]);
    }
  }

  return trimmed;
}

export function QRScanner({ onScanSuccess, autoScanId }: QRScannerProps) {
  const { addItem } = useCart();
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [sampleProducts, setSampleProducts] = useState<any[]>([]);
  const [lastScannedProduct, setLastScannedProduct] = useState<any | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isInsecureOrigin, setIsInsecureOrigin] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastScannedCodeRef = useRef<{ code: string; time: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if page is loaded on insecure HTTP (which blocks mobile camera)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!window.isSecureContext && !isLocalhost) {
        setIsInsecureOrigin(true);
      }
    }
  }, []);

  // Fetch sample products for simulator
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

  // Handle auto-scan if URL contained a productId (e.g., from native camera)
  const autoScanProcessedRef = useRef(false);
  useEffect(() => {
    if (autoScanId && !autoScanProcessedRef.current) {
      autoScanProcessedRef.current = true;
      fetchAndAddToCart(autoScanId);
    }
  }, [autoScanId]);

  // Main fetch and add to cart function
  const fetchAndAddToCart = useCallback(
    async (rawIdentifier: string) => {
      const identifier = extractIdentifier(rawIdentifier);
      if (!identifier) return;

      setLoadingCode(true);
      try {
        // Try direct lookup by ID, SKU, or Barcode
        const res = await fetch(`/api/products/${encodeURIComponent(identifier)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            triggerScanFeedback();
            addItem(data.product, 1);
            setLastScannedProduct(data.product);
            toast.success(`Added ${data.product.name} to cart!`);
            if (onScanSuccess) onScanSuccess(data.product.id);
            return;
          }
        }

        // Fallback: search across all product attributes
        const searchRes = await fetch(`/api/products?search=${encodeURIComponent(identifier)}`);
        const searchData = await searchRes.json();
        if (searchRes.ok && searchData.products?.length > 0) {
          const product = searchData.products[0];
          triggerScanFeedback();
          addItem(product, 1);
          setLastScannedProduct(product);
          toast.success(`Added ${product.name} to cart!`);
          if (onScanSuccess) onScanSuccess(product.id);
        } else {
          toast.error(`Product "${identifier}" not found in this store.`);
        }
      } catch (e) {
        toast.error("Failed to fetch product information.");
      } finally {
        setLoadingCode(false);
      }
    },
    [addItem, onScanSuccess]
  );

  // Decoded text processor with debounce cooldown
  const handleDecodedText = useCallback(
    async (decodedText: string) => {
      const cleanCode = decodedText.trim();
      const now = Date.now();

      // Prevent duplicate scan of the same item within 2.5 seconds
      if (
        lastScannedCodeRef.current &&
        lastScannedCodeRef.current.code === cleanCode &&
        now - lastScannedCodeRef.current.time < 2500
      ) {
        return;
      }

      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      lastScannedCodeRef.current = { code: cleanCode, time: now };

      try {
        await fetchAndAddToCart(cleanCode);
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1200);
      }
    },
    [fetchAndAddToCart]
  );

  // Safely stop the camera
  const stopScanner = useCallback(async () => {
    try {
      if (html5QrCodeRef.current && isScanningRef.current) {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
      }
    } catch (e) {
      console.error("Error stopping scanner:", e);
    } finally {
      setScannerActive(false);
      setTorchOn(false);
      setHasTorch(false);
    }
  }, []);

  // Start scanner using Html5Qrcode core instance
  const startScanner = useCallback(async () => {
    setCameraError(null);
    setScannerActive(true);

    // Give the DOM a moment to mount #qr-video-region
    setTimeout(async () => {
      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode("qr-video-region", {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_39,
            ],
            verbose: false,
          });
        }

        // Query available cameras
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
          }
        } catch {
          // Camera query failed or unsupported
        }

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.max(180, Math.floor(minEdge * 0.72));
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
        };

        // Attempt back camera first (environment), fallback to user/default camera
        try {
          await html5QrCodeRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText) => handleDecodedText(decodedText),
            () => {
              // Benign frame error, ignore
            }
          );
        } catch {
          // Fallback to front/user camera (e.g. laptop webcam)
          await html5QrCodeRef.current.start(
            { facingMode: "user" },
            config,
            (decodedText) => handleDecodedText(decodedText),
            () => {}
          );
        }

        isScanningRef.current = true;

        // Check if torch is supported
        try {
          const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
          if (capabilities && (capabilities as any).torch) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: any) {
        console.error("Camera startup error:", err);
        isScanningRef.current = false;
        setScannerActive(false);

        let errorMsg = "Unable to access device camera.";
        if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
          errorMsg = "Camera permission was denied. Please allow camera access in browser settings.";
        } else if (err.name === "NotFoundError") {
          errorMsg = "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          errorMsg = "Camera is already in use by another application.";
        }
        setCameraError(errorMsg);
      }
    }, 150);
  }, [handleDecodedText]);

  // Switch between cameras (if multiple exist)
  const switchCamera = async () => {
    if (availableCameras.length <= 1 || !html5QrCodeRef.current) return;
    const nextIndex = (selectedCameraIndex + 1) % availableCameras.length;
    setSelectedCameraIndex(nextIndex);

    try {
      if (isScanningRef.current) {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
      }
      const nextCamera = availableCameras[nextIndex];
      await html5QrCodeRef.current.start(
        nextCamera.id,
        {
          fps: 15,
          qrbox: (w, h) => {
            const edge = Math.floor(Math.min(w, h) * 0.72);
            return { width: edge, height: edge };
          },
        },
        (decodedText) => handleDecodedText(decodedText),
        () => {}
      );
      isScanningRef.current = true;
      toast.info(`Switched to: ${nextCamera.label || "Camera " + (nextIndex + 1)}`);
    } catch (e) {
      console.error("Error switching camera:", e);
    }
  };

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.error("Torch error:", e);
    }
  };

  // Upload an image / photo to scan QR code
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      // Create a temporary Html5Qrcode instance for file decoding
      const tempScanner = new Html5Qrcode("qr-file-temp");
      const decodedText = await tempScanner.scanFile(file, false);
      await tempScanner.clear();
      await fetchAndAddToCart(decodedText);
    } catch (err: any) {
      toast.error("Could not find a valid QR code in this image.");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && isScanningRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Hidden container for file scanning */}
      <div id="qr-file-temp" className="hidden" />

      {/* Insecure Origin Alert */}
      {isInsecureOrigin && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Insecure Connection Detected</p>
            <p className="mt-0.5 opacity-90">
              Browsers restrict camera access on non-HTTPS origins when testing over local Wi-Fi.
              Use <strong>localhost</strong>, your <strong>Vercel URL</strong>, or upload a photo below.
            </p>
          </div>
        </div>
      )}

      {/* Live Camera Scanner Box */}
      <Card className="overflow-hidden border-2 border-primary/20 shadow-xl relative">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Live In-Store Scanner
          </CardTitle>
          <CardDescription>
            Scan shelf QR codes or barcodes to automatically add items to your cart
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 flex flex-col items-center">
          {scannerActive ? (
            <div className="w-full space-y-3">
              {/* Camera Video Viewport */}
              <div className="relative w-full aspect-square max-h-[360px] overflow-hidden rounded-2xl bg-black border shadow-inner flex items-center justify-center">
                <div id="qr-video-region" className="w-full h-full object-cover" />

                {/* Modern Viewfinder Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 relative rounded-2xl border-2 border-primary/40">
                    {/* Glowing corners */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

                    {/* Laser scanning line animation */}
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                </div>

                {/* On-video Control Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all"
                      title={torchOn ? "Turn off torch" : "Turn on torch"}
                    >
                      {torchOn ? (
                        <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <ZapOff className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {availableCameras.length > 1 && (
                    <button
                      type="button"
                      onClick={switchCamera}
                      className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all"
                      title="Flip camera"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stop Camera Button */}
              <Button
                variant="destructive"
                size="sm"
                className="w-full font-semibold shadow"
                onClick={stopScanner}
              >
                <CameraOff className="h-4 w-4 mr-2" /> Stop Camera
              </Button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center py-8 px-4 text-center border-2 border-dashed rounded-2xl bg-muted/30">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Camera className="h-8 w-8" />
              </div>
              <p className="font-bold text-sm">Camera is inactive</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Tap below to open your camera and scan QR codes or barcodes directly from store shelves
              </p>

              {cameraError && (
                <div className="mt-3 p-2.5 bg-destructive/10 text-destructive rounded-lg text-xs font-medium max-w-xs">
                  {cameraError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 mt-5 w-full max-w-xs">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full font-semibold shadow-md"
                  onClick={startScanner}
                >
                  <Camera className="h-5 w-5 mr-2" /> Open Camera
                </Button>

                {/* Upload QR Image Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="lg"
                  disabled={uploadLoading}
                  className="w-full font-semibold"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadLoading ? "Scanning..." : "Upload Photo"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Scanned Item Banner */}
      {lastScannedProduct && (
        <Card className="border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 shadow-md">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Just Added to Cart
                </p>
                <p className="font-bold text-sm truncate">{lastScannedProduct.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(lastScannedProduct.price)} • SKU: {lastScannedProduct.sku}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => fetchAndAddToCart(lastScannedProduct.id)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add +1
              </Button>
              <Link href="/cart">
                <Button size="sm" variant="gradient" className="h-8 px-3 text-xs font-semibold">
                  Cart <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Code / SKU / Barcode Entry */}
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
              placeholder="Enter product SKU, ID, or Barcode (e.g. TEA-001)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="text-xs h-10"
            />
            <Button
              type="submit"
              variant="secondary"
              className="h-10 text-xs shrink-0 font-semibold"
              disabled={loadingCode || !manualCode.trim()}
            >
              {loadingCode ? "Adding..." : "Add to Cart"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 1-Click Test Simulator for Verification */}
      <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            1-Click Simulator (Test Without Physical Scanner)
          </div>
          <CardDescription className="text-xs">
            Tap any shelf item below to simulate scanning its physical QR tag:
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {sampleProducts.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => fetchAndAddToCart(prod.id)}
                className="flex items-center justify-between p-2.5 rounded-xl border bg-background hover:border-primary text-left transition-all group shadow-sm hover:shadow"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-xs truncate group-hover:text-primary">
                    {prod.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatCurrency(prod.price)} • {prod.sku}
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
