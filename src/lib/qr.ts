import QRCode from "qrcode";

export interface QRCodeData {
  productId: string;
  storeId: string;
  sku: string;
}

export async function generateProductQRCodeDataUrl(
  productId: string,
  storeId: string,
  sku: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // The QR code contains the direct scan/product URL or JSON payload
  const payload = `${baseUrl}/scan?productId=${productId}&storeId=${storeId}`;

  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 2,
      width: 400,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

export async function generateProductQRCodeBuffer(
  productId: string,
  storeId: string,
  sku: string
): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const payload = `${baseUrl}/scan?productId=${productId}&storeId=${storeId}`;

  try {
    const buffer = await QRCode.toBuffer(payload, {
      errorCorrectionLevel: "H",
      type: "png",
      margin: 2,
      width: 400,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    return buffer;
  } catch (error) {
    console.error("Error generating QR buffer:", error);
    throw new Error("Failed to generate QR buffer");
  }
}
