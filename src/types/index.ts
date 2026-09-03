export type Role = 'owner' | 'customer';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'expired' | 'pending';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  sku: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface ProductType {
  id: string;
  storeId: string;
  name: string;
  price: number;
  sku: string;
  barcode?: string | null;
  stockQty: number;
  category: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  qrCodeUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StoreType {
  id: string;
  ownerId: string;
  storeName: string;
  address: string;
  taxRate: number;
  upiVpa: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionRenewalDate?: string | Date | null;
  lowStockThreshold: number;
}
