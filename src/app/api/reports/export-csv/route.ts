import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const store = await db.store.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const where: any = { storeId: store.id };
    if (startDateParam || endDateParam) {
      where.createdAt = {};
      if (startDateParam) where.createdAt.gte = new Date(startDateParam);
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    const headers = [
      "Invoice Number",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Items Count",
      "Subtotal (INR)",
      "Tax Amount (INR)",
      "Discount (INR)",
      "Total Amount (INR)",
      "Payment Status",
      "Transaction Ref",
      "UPI VPA",
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = orders.map((order) => {
      const items = JSON.parse(order.items);
      const itemsCount = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);

      return [
        escapeCsv(order.invoiceNumber),
        escapeCsv(new Date(order.createdAt).toISOString()),
        escapeCsv(order.user.name),
        escapeCsv(order.user.email),
        escapeCsv(order.user.phone || ""),
        itemsCount,
        order.subtotal.toFixed(2),
        order.taxAmount.toFixed(2),
        order.discount.toFixed(2),
        order.total.toFixed(2),
        escapeCsv(order.paymentStatus),
        escapeCsv(order.transactionRef || ""),
        escapeCsv(order.upiVpa || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="QRShop-Report-${store.id.slice(-4)}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating CSV report:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV report" },
      { status: 500 }
    );
  }
}
