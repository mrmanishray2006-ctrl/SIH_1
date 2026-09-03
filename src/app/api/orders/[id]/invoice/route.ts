import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import PDFDocument from "pdfkit";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        store: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = JSON.parse(order.items);

    // Create PDF in memory
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // 1. Header Banner
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(order.store.storeName, { align: "left" });

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(order.store.address, { align: "left" })
      .text(`UPI VPA: ${order.store.upiVpa || "N/A"}`, { align: "left" });

    // Right-aligned Invoice Title & Number
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#2563eb")
      .text("TAX INVOICE / RECEIPT", 350, 40, { align: "right" });

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(`Invoice #: ${order.invoiceNumber}`, 350, 65, { align: "right" })
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        350,
        80,
        { align: "right" }
      )
      .text(`Status: ${order.paymentStatus.toUpperCase()}`, 350, 95, {
        align: "right",
      });

    doc.moveDown(2);
    const dividerY = 120;
    doc
      .moveTo(40, dividerY)
      .lineTo(555, dividerY)
      .lineWidth(1)
      .strokeColor("#e2e8f0")
      .stroke();

    // 2. Customer & Payment Details
    const infoY = 135;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Billed To:", 40, infoY)
      .font("Helvetica")
      .fillColor("#334155")
      .text(order.user.name, 40, infoY + 15)
      .text(order.user.email, 40, infoY + 28);

    if (order.user.phone) {
      doc.text(`Phone: ${order.user.phone}`, 40, infoY + 41);
    }

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Payment Info:", 350, infoY)
      .font("Helvetica")
      .fillColor("#334155")
      .text(`Method: UPI (Razorpay)`, 350, infoY + 15)
      .text(`Txn Ref: ${order.transactionRef || "N/A"}`, 350, infoY + 28);

    // 3. Items Table Header
    const tableTop = 200;
    doc
      .rect(40, tableTop, 515, 24)
      .fillColor("#f8fafc")
      .fill();

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#475569")
      .text("#", 50, tableTop + 7)
      .text("Item Description", 80, tableTop + 7)
      .text("Price (INR)", 330, tableTop + 7, { width: 60, align: "right" })
      .text("Qty", 410, tableTop + 7, { width: 40, align: "center" })
      .text("Total (INR)", 470, tableTop + 7, { width: 75, align: "right" });

    // Table rows
    let currentY = tableTop + 28;
    items.forEach((item: any, index: number) => {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#1e293b")
        .text(String(index + 1), 50, currentY)
        .text(item.name, 80, currentY, { width: 230, ellipsis: true })
        .text(item.price.toFixed(2), 330, currentY, { width: 60, align: "right" })
        .text(String(item.quantity), 410, currentY, { width: 40, align: "center" })
        .text(item.total.toFixed(2), 470, currentY, { width: 75, align: "right" });

      currentY += 20;
      doc
        .moveTo(40, currentY - 4)
        .lineTo(555, currentY - 4)
        .lineWidth(0.5)
        .strokeColor("#f1f5f9")
        .stroke();
    });

    // 4. Totals Breakdown
    currentY += 15;
    const totalsLeft = 350;

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text("Subtotal:", totalsLeft, currentY)
      .text(`Rs. ${order.subtotal.toFixed(2)}`, 470, currentY, {
        width: 75,
        align: "right",
      });

    if (order.discount > 0) {
      currentY += 18;
      doc
        .fillColor("#16a34a")
        .text("Discount:", totalsLeft, currentY)
        .text(`- Rs. ${order.discount.toFixed(2)}`, 470, currentY, {
          width: 75,
          align: "right",
        });
    }

    currentY += 18;
    doc
      .fillColor("#475569")
      .text(`Taxes (${order.store.taxRate}%):`, totalsLeft, currentY)
      .text(`Rs. ${order.taxAmount.toFixed(2)}`, 470, currentY, {
        width: 75,
        align: "right",
      });

    currentY += 22;
    doc
      .rect(totalsLeft - 10, currentY - 5, 215, 28)
      .fillColor("#eff6ff")
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#1e3a8a")
      .text("Total Paid:", totalsLeft, currentY + 3)
      .text(`Rs. ${order.total.toFixed(2)}`, 470, currentY + 3, {
        width: 75,
        align: "right",
      });

    // 5. Footer & Terms
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text(
        "This is an authentic computer-generated receipt issued via QRShop Retail.",
        40,
        740,
        { align: "center", width: 515 }
      )
      .text(
        "Thank you for shopping with us! Please save this invoice for warranty or returns.",
        40,
        755,
        { align: "center", width: 515 }
      );

    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
