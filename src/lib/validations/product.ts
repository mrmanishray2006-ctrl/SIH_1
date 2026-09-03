import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters long"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  sku: z.string().min(2, "SKU must be at least 2 characters long"),
  barcode: z.string().optional().nullable(),
  stockQty: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  category: z.string().min(1, "Category is required").default("General"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateStockSchema = z.object({
  stockQty: z.coerce.number().int().min(0, "Stock cannot be negative"),
});

export type ProductInput = z.infer<typeof productSchema>;
