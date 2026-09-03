import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { productIds } = body;

    const store = await db.store.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const where: any = { storeId: store.id };
    if (Array.isArray(productIds) && productIds.length > 0) {
      where.id = { in: productIds };
    }

    const products = await db.product.findMany({
      where,
      orderBy: { name: "asc" },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 });
    }

    // Generate PDF in memory with PDFKit
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // PDF Header
    doc.fontSize(20).font("Helvetica-Bold").text(store.storeName, { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("Product QR Code Shelf Labels - Scan to Buy", { align: "center" })
      .moveDown(1.5);

    doc.fillColor("#0f172a");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Layout: 2 columns grid of printable label cards
    const cardWidth = 250;
    const cardHeight = 180;
    const startX = 40;
    let currentX = startX;
    let currentY = doc.y;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // Check if need new page
      if (currentY + cardHeight > doc.page.height - 40) {
        doc.addPage();
        currentY = 40;
        currentX = startX;
      }

      // Draw Card Border
      doc
        .roundedRect(currentX, currentY, cardWidth, cardHeight, 8)
        .lineWidth(1)
        .strokeColor("#cbd5e1")
        .stroke();

      // Card Header Banner
      doc
        .roundedRect(currentX, currentY, cardWidth, 24, 8)
        .fillColor("#f1f5f9")
        .fill();
      doc
        .rect(currentX, currentY + 16, cardWidth, 8)
        .fillColor("#f1f5f9")
        .fill();

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#475569")
        .text(store.storeName.toUpperCase(), currentX + 10, currentY + 8, {
          width: cardWidth - 20,
          ellipsis: true,
        });

      // Product QR Code
      const qrPayload = `${baseUrl}/scan?productId=${product.id}&storeId=${store.id}`;
      const qrBuffer = await QRCode.toBuffer(qrPayload, {
        errorCorrectionLevel: "H",
        width: 250,
        margin: 1,
      });

      // Embed QR image on the left side of card
      doc.image(qrBuffer, currentX + 10, currentY + 35, {
        width: 100,
        height: 100,
      });

      // Product Details on the right side of card
      const textX = currentX + 120;
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#0f172a")
        .text(product.name, textX, currentY + 35, {
          width: 120,
          height: 40,
          ellipsis: true,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#2563eb")
        .text(`Rs. ${product.price.toFixed(2)}`, textX, currentY + 80);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#64748b")
        .text(`SKU: ${product.sku}`, textX, currentY + 105)
        .text(`Category: ${product.category}`, textX, currentY + 118);

      // Card bottom instruction
      doc
        .font("Helvetica-Oblique")
        .fontSize(7)
        .fillColor("#94a3b8")
        .text("Scan using QRShop App to Add to Cart", currentX + 10, currentY + 145, {
          width: cardWidth - 20,
          align: "center",
        });

      // Update grid positioning for next card
      if (currentX === startX) {
        currentX = startX + cardWidth + 20;
      } else {
        currentX = startX;
        currentY += cardHeight + 20;
      }
    }

    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="QRShop-Labels-${store.id.slice(-4)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating QR labels PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate QR labels PDF" },
      { status: 500 }
    );
  }
}
