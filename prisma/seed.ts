import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing records in correct order
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Store Owner
  const owner = await prisma.user.create({
    data: {
      name: "Rajesh Sharma",
      email: "owner@qrshop.com",
      passwordHash,
      role: "owner",
      phone: "+91 9876543210",
    },
  });

  // 2. Create Store
  const store = await prisma.store.create({
    data: {
      ownerId: owner.id,
      storeName: "SuperMart Fresh & Daily",
      address: "Shop 14, Galaxy Enclave, Indiranagar, Bengaluru, 560038",
      taxRate: 5.0, // 5% GST
      upiVpa: "supermart@okicici",
      subscriptionPlan: "pro",
      subscriptionStatus: "active",
      subscriptionRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lowStockThreshold: 5,
    },
  });

  // 3. Create Subscription
  await prisma.subscription.create({
    data: {
      storeId: store.id,
      plan: "pro",
      amount: 1299.0,
      status: "active",
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentMethod: "Razorpay UPI",
      autoRenew: true,
    },
  });

  // 4. Create Customer
  const customer = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "customer@qrshop.com",
      passwordHash,
      role: "customer",
      phone: "+91 9123456780",
    },
  });

  // 5. Create Diverse Products with generated QR codes
  const sampleProducts = [
    {
      name: "Organic Green Tea (25 Bags)",
      price: 199.0,
      sku: "TEA-001",
      barcode: "8901030381001",
      stockQty: 25,
      category: "Beverages",
      description: "Premium whole-leaf green tea packed with rich antioxidants.",
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80",
    },
    {
      name: "Almond Milk Unsweetened 1L",
      price: 249.0,
      sku: "MLK-002",
      barcode: "8901030381002",
      stockQty: 18,
      category: "Dairy & Alternatives",
      description: "Plant-based milk fortified with calcium and vitamin D.",
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80",
    },
    {
      name: "Artisan Dark Chocolate 70%",
      price: 150.0,
      sku: "CHO-003",
      barcode: "8901030381003",
      stockQty: 4, // Low stock trigger
      category: "Confectionery",
      description: "Single-origin cocoa bean dark chocolate with velvety texture.",
      imageUrl: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=500&q=80",
    },
    {
      name: "Cold Pressed Olive Oil 500ml",
      price: 499.0,
      sku: "OIL-004",
      barcode: "8901030381004",
      stockQty: 12,
      category: "Pantry",
      description: "Extra virgin cold-pressed olive oil for heart-healthy cooking.",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80",
    },
    {
      name: "Whole Wheat Sourdough Bread",
      price: 85.0,
      sku: "BRD-005",
      barcode: "8901030381005",
      stockQty: 3, // Low stock trigger
      category: "Bakery",
      description: "Naturally fermented rustic artisanal sourdough loaf.",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
    },
    {
      name: "Roasted Salted Cashews 200g",
      price: 280.0,
      sku: "NUT-006",
      barcode: "8901030381006",
      stockQty: 30,
      category: "Snacks",
      description: "Crunchy oven-roasted jumbo cashews with pink Himalayan salt.",
      imageUrl: "https://images.unsplash.com/photo-1536591375315-1b83842c9496?w=500&q=80",
    },
  ];

  const createdProducts = [];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const item of sampleProducts) {
    // Generate placeholder product first to get ID
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: item.name,
        price: item.price,
        sku: item.sku,
        barcode: item.barcode,
        stockQty: item.stockQty,
        category: item.category,
        description: item.description,
        imageUrl: item.imageUrl,
        isActive: true,
      },
    });

    // Generate QR code Data URL pointing to scan page
    const qrPayload = `${baseUrl}/scan?productId=${product.id}&storeId=${store.id}`;
    const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
    });

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { qrCodeUrl },
    });

    createdProducts.push(updated);
  }

  // 6. Create realistic past orders to populate Analytics & Reports
  const order1Items = [
    {
      productId: createdProducts[0].id,
      name: createdProducts[0].name,
      price: createdProducts[0].price,
      quantity: 2,
      total: createdProducts[0].price * 2,
    },
    {
      productId: createdProducts[2].id,
      name: createdProducts[2].name,
      price: createdProducts[2].price,
      quantity: 1,
      total: createdProducts[2].price,
    },
  ];
  const order1Subtotal = 199.0 * 2 + 150.0; // 548.0
  const order1Tax = Math.round(order1Subtotal * 0.05 * 100) / 100; // 27.4
  const order1Total = order1Subtotal + order1Tax; // 575.4

  await prisma.order.create({
    data: {
      userId: customer.id,
      storeId: store.id,
      invoiceNumber: `INV-${store.id.slice(-4).toUpperCase()}-20260901-0001`,
      items: JSON.stringify(order1Items),
      subtotal: order1Subtotal,
      taxAmount: order1Tax,
      discount: 0.0,
      total: order1Total,
      paymentStatus: "paid",
      transactionRef: "pay_sim_sample_101",
      upiVpa: store.upiVpa,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const order2Items = [
    {
      productId: createdProducts[3].id,
      name: createdProducts[3].name,
      price: createdProducts[3].price,
      quantity: 1,
      total: createdProducts[3].price,
    },
  ];
  const order2Subtotal = 499.0;
  const order2Tax = Math.round(order2Subtotal * 0.05 * 100) / 100;
  const order2Total = order2Subtotal + order2Tax;

  await prisma.order.create({
    data: {
      userId: customer.id,
      storeId: store.id,
      invoiceNumber: `INV-${store.id.slice(-4).toUpperCase()}-20260902-0002`,
      items: JSON.stringify(order2Items),
      subtotal: order2Subtotal,
      taxAmount: order2Tax,
      discount: 0.0,
      total: order2Total,
      paymentStatus: "paid",
      transactionRef: "pay_sim_sample_102",
      upiVpa: store.upiVpa,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("--- TEST ACCOUNTS ---");
  console.log("Store Owner: owner@qrshop.com / password123");
  console.log("Customer:    customer@qrshop.com / password123");
  console.log(`Store ID:    ${store.id}`);
  console.log(`Products:    ${createdProducts.length} created with live QR codes`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
