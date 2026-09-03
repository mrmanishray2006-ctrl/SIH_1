import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { generateInvoiceNumber } from "@/lib/utils";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderMetadata,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !orderMetadata) {
      return NextResponse.json(
        { error: "Missing required payment verification details." },
        { status: 400 }
      );
    }

    // 1. Signature check
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || "sim_sig_test"
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature. Payment could not be verified." },
        { status: 400 }
      );
    }

    const { storeId, items, subtotal, taxAmount, discount, total, upiVpa } =
      orderMetadata;

    // Use logged in user or a guest/demo customer account
    let userId = session?.user?.id;
    let customerName = session?.user?.name || "Shopper";
    let customerEmail = session?.user?.email || "customer@qrshop.com";

    if (!userId) {
      // Find default customer or create a fast guest customer
      let guest = await db.user.findFirst({ where: { role: "customer" } });
      if (!guest) {
        guest = await db.user.create({
          data: {
            name: "Customer Guest",
            email: `guest_${Date.now()}@qrshop.com`,
            passwordHash: "none",
            role: "customer",
          },
        });
      }
      userId = guest.id;
    }

    // Determine sequence number for invoice today
    const orderCountToday = await db.order.count({
      where: { storeId },
    });
    const invoiceNumber = generateInvoiceNumber(storeId, orderCountToday + 1);

    // 2. Atomic Database Transaction:
    // Decrement stock for all items and create the paid Order record
    const resultOrder = await db.$transaction(async (tx) => {
      // Decrement stock atomically
      for (const item of items) {
        const currentProd = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!currentProd || currentProd.stockQty < item.quantity) {
          throw new Error(
            `Item ${item.name} is no longer available in the requested quantity.`
          );
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          storeId,
          invoiceNumber,
          items: JSON.stringify(items),
          subtotal,
          taxAmount,
          discount: discount || 0.0,
          total,
          paymentStatus: "paid",
          transactionRef: razorpay_payment_id,
          upiVpa: upiVpa || null,
        },
        include: {
          store: true,
        },
      });

      // Clear customer's stored cart
      await tx.cart.deleteMany({
        where: {
          userId,
          storeId,
        },
      });

      return newOrder;
    });

    // 3. Dispatch Email confirmation asynchronously
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    sendOrderConfirmationEmail({
      to: customerEmail,
      customerName,
      orderNumber: resultOrder.invoiceNumber,
      total: resultOrder.total,
      storeName: resultOrder.store.storeName,
      invoiceUrl: `${baseUrl}/orders/${resultOrder.id}`,
    }).catch((err) => console.error("Email dispatch log:", err));

    return NextResponse.json({
      success: true,
      message: "Payment verified and order created successfully",
      order: {
        id: resultOrder.id,
        invoiceNumber: resultOrder.invoiceNumber,
        total: resultOrder.total,
        transactionRef: resultOrder.transactionRef,
        createdAt: resultOrder.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Payment verification transaction failed:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to finalize order and decrement inventory.",
      },
      { status: 500 }
    );
  }
}
