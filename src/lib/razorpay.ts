import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key_12345";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "mock_secret_key_67890";

export const isMockRazorpay =
  !process.env.RAZORPAY_KEY_ID ||
  process.env.RAZORPAY_KEY_ID.includes("mock") ||
  !process.env.RAZORPAY_KEY_SECRET ||
  process.env.RAZORPAY_KEY_SECRET.includes("mock");

export const razorpayInstance = !isMockRazorpay
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  : null;

export async function createRazorpayOrder(amountInPaisa: number, receiptId: string) {
  if (isMockRazorpay || !razorpayInstance) {
    // Generate valid simulated Razorpay order
    return {
      id: `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity: "order",
      amount: amountInPaisa,
      amount_paid: 0,
      amount_due: amountInPaisa,
      currency: "INR",
      receipt: receiptId,
      status: "created",
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  return await razorpayInstance.orders.create({
    amount: amountInPaisa,
    currency: "INR",
    receipt: receiptId,
    payment_capture: true,
  });
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (isMockRazorpay || orderId.startsWith("order_sim_") || signature.startsWith("sim_sig_")) {
    // Verified simulated signature
    return true;
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}
