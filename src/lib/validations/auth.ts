import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["owner", "customer"]).default("customer"),
  phone: z.string().optional(),
  storeName: z.string().optional(),
  address: z.string().optional(),
  upiVpa: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional().default(5.0),
}).refine(
  (data) => {
    if (data.role === "owner") {
      return !!data.storeName && data.storeName.length >= 2;
    }
    return true;
  },
  {
    message: "Store name is required for store owners",
    path: ["storeName"],
  }
).refine(
  (data) => {
    if (data.role === "owner") {
      return !!data.upiVpa && data.upiVpa.includes("@");
    }
    return true;
  },
  {
    message: "Valid UPI VPA (e.g. storename@upi) is required for store owners",
    path: ["upiVpa"],
  }
);

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
