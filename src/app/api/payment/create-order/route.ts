import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createRazorpayOrder, isMockRazorpay } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const ip = req.headers.get("x-forwarded-for") || "local";
    const limiter = rateLimit(`pay-order-${ip}`, 20, 60000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many payment requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { storeId, items, promoCode } = body;

    if (!storeId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid order parameters or empty cart." },
        { status: 400 }
      );
    }

    // 1. Fetch store info
    const store = await db.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    // 2. Fetch and validate live product prices & stock from database
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds }, storeId },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedOrderItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found or unavailable: ${item.name || item.productId}` },
          { status: 400 }
        );
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `"${product.name}" is currently unavailable.` },
          { status: 400 }
        );
      }

      if (product.stockQty < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Only ${product.stockQty} left.`,
          },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      calculatedSubtotal += itemTotal;
      validatedOrderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // 3. Compute discount
    let discount = 0;
    if (promoCode === "SAVE10") {
      discount = Math.round(calculatedSubtotal * 0.1 * 100) / 100;
    } else if (promoCode === "QR50") {
      discount = Math.min(50, calculatedSubtotal);
    }

    // 4. Compute Tax & Grand Total
    const taxableAmount = Math.max(0, calculatedSubtotal - discount);
    const taxAmount = Math.round(taxableAmount * (store.taxRate / 100) * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // Amount in paise for Razorpay
    const amountInPaise = Math.round(totalAmount * 100);

    const receiptId = `rcpt_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(amountInPaise, receiptId);

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key_12345",
      isMock: isMockRazorpay,
      orderMetadata: {
        storeId,
        storeName: store.storeName,
        upiVpa: store.upiVpa,
        subtotal: calculatedSubtotal,
        taxAmount,
        discount,
        total: totalAmount,
        items: validatedOrderItems,
      },
    });
  } catch (error) {
    console.error("Payment order creation failed:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment gateway" },
      { status: 500 }
    );
  }
}
