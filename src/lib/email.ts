export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  total,
  storeName,
  invoiceUrl,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  total: number;
  storeName: string;
  invoiceUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[Email Notification - Sim] To: ${to} | Invoice: ${orderNumber} | Total: ₹${total} | Store: ${storeName} | Invoice link: ${invoiceUrl}`
    );
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "QRShop Orders <onboarding@resend.dev>",
        to: [to],
        subject: `Order Confirmation - ${orderNumber} at ${storeName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb;">Payment Successful!</h2>
            <p>Hi ${customerName},</p>
            <p>Thank you for shopping at <strong>${storeName}</strong>. Your payment of <strong>₹${total.toFixed(2)}</strong> has been processed successfully.</p>
            <p><strong>Invoice Number:</strong> ${orderNumber}</p>
            <p style="margin-top: 24px;">
              <a href="${invoiceUrl}" style="background-color: #2563eb; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View & Download Invoice PDF
              </a>
            </p>
            <p style="color: #64748b; font-size: 13px; margin-top: 32px;">This is an automated receipt from QRShop Retail.</p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (error) {
    console.error("Failed to send order email:", error);
    return { success: false, error };
  }
}
