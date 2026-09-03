import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local-ip";
    const limiter = rateLimit(`register-${ip}`, 5, 60000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validatedData = registerSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid registration data", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role, phone, storeName, address, upiVpa, taxRate } =
      validatedData.data;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (role === "owner") {
      // Create user and associated store in a transaction
      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email: normalizedEmail,
            passwordHash,
            role: "owner",
            phone: phone || null,
          },
        });

        const store = await tx.store.create({
          data: {
            ownerId: user.id,
            storeName: storeName || `${name}'s Store`,
            address: address || "Retail Store Address",
            taxRate: taxRate ?? 5.0,
            upiVpa: upiVpa || "merchant@upi",
            subscriptionPlan: "starter",
            subscriptionStatus: "active",
            subscriptionRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
            lowStockThreshold: 5,
          },
        });

        await tx.subscription.create({
          data: {
            storeId: store.id,
            plan: "starter",
            amount: 0,
            status: "active",
            startDate: new Date(),
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentMethod: "Free Trial",
            autoRenew: false,
          },
        });

        return { user, store };
      });

      return NextResponse.json(
        {
          message: "Owner account and store registered successfully",
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            storeId: result.store.id,
          },
        },
        { status: 201 }
      );
    } else {
      // Customer registration
      const user = await db.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role: "customer",
          phone: phone || null,
        },
      });

      return NextResponse.json(
        {
          message: "Customer account created successfully",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
