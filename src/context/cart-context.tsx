"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { CartItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  storeId: string | null;
  setStoreId: (id: string) => void;
  addItem: (product: { id: string; name: string; price: number; sku: string; imageUrl?: string | null; storeId: string }, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  promoCode: string;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(5.0);
  const [promoCode, setPromoCode] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("qrshop_cart");
      const savedStoreId = localStorage.getItem("qrshop_storeId");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      if (savedStoreId) {
        setStoreId(savedStoreId);
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem("qrshop_cart", JSON.stringify(items));
      if (storeId) {
        localStorage.setItem("qrshop_storeId", storeId);
      }
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, storeId]);

  const addItem = (
    product: { id: string; name: string; price: number; sku: string; imageUrl?: string | null; storeId: string },
    quantity = 1
  ) => {
    // If shopping at a different store, confirm or switch
    if (storeId && storeId !== product.storeId && items.length > 0) {
      const confirmSwitch = window.confirm(
        "You have items from another store in your cart. Would you like to clear your cart and start shopping here?"
      );
      if (!confirmSwitch) return;
      setItems([]);
    }

    setStoreId(product.storeId);

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            sku: product.sku,
            imageUrl: product.imageUrl,
            quantity,
          },
        ];
      }
    });

    toast.success(`Added ${product.name} to cart!`, {
      description: `₹${product.price.toFixed(2)}`,
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    toast.info("Item removed from cart");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode("");
    setDiscount(0);
    localStorage.removeItem("qrshop_cart");
  };

  const applyPromoCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === "SAVE10") {
      setPromoCode(clean);
      toast.success("Coupon SAVE10 applied! 10% discount on subtotal");
      return true;
    } else if (clean === "QR50") {
      setPromoCode(clean);
      toast.success("Coupon QR50 applied! ₹50 off on order");
      return true;
    } else {
      toast.error("Invalid coupon code. Try SAVE10 or QR50");
      return false;
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setDiscount(0);
    toast.info("Coupon removed");
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Recalculate discount
  let calculatedDiscount = 0;
  if (promoCode === "SAVE10") {
    calculatedDiscount = Math.round(subtotal * 0.1 * 100) / 100;
  } else if (promoCode === "QR50") {
    calculatedDiscount = Math.min(50, subtotal);
  }

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const taxAmount = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
  const total = Math.max(0, taxableAmount + taxAmount);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        storeId,
        setStoreId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        taxRate,
        setTaxRate,
        promoCode,
        applyPromoCode,
        removePromoCode,
        subtotal,
        taxAmount,
        discount: calculatedDiscount,
        total,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
