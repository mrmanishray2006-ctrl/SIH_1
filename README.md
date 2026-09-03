# QRShop - Scan, Pay & Go Retail Platform

> Production-ready retail store web application featuring **Self-Checkout QR Scanner**, **Razorpay UPI Payments**, **Sequential Tax Invoicing**, and an **Owner Management Portal** with real-time inventory alerts, auto-generated QR shelf labels, and financial analytics.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Lucide Icons + Next-Themes (Dark Mode)
- **Backend**: Next.js API Routes & Server Actions
- **Database & ORM**: Prisma ORM with SQLite (zero-config local development) and PostgreSQL schema ready for production
- **Authentication**: NextAuth.js (Credentials Provider + JWT sessions + RBAC middleware)
- **QR Engine**: `qrcode` (Node) + `qrcode.react` (Frontend) + `html5-qrcode` (In-browser camera scanner)
- **Invoicing & PDF**: PDFKit (server-side streaming tax receipts and multi-product printable QR shelf labels)
- **Payment Gateway**: Razorpay (UPI intent, UPI VPA routing, signature verification, and Test Mock mode)
- **State Management**: React Context (`CartContext`) + TanStack Query
- **Notifications**: Sonner (rich toasts with audio-visual cues)
- **Analytics**: Recharts (30-day interactive sales and order volume trends)

---

## Roles & Features

### 1. Store Owner Portal (`/dashboard`)
- **Dashboard Overview**: 4 live KPI cards (Total active products, today's sales, monthly revenue, low-stock count), 30-day interactive revenue curve via Recharts, and latest customer orders table.
- **Product & QR Management (`/dashboard/products`)**:
  - Add / edit / delete products with image upload.
  - On product creation: Automatically generates high-resolution QR code URL linked to the store.
  - Product QR preview dialog with individual PNG download.
  - **Bulk QR Export**: 1-click generation of formatted, multi-column A4 printable PDF shelf label cards showing product name, SKU, price, and scannable QR.
  - Soft toggle (`isActive`) to instantly enable/disable items.
- **Stock Management (`/dashboard/stock`)**:
  - Quick inline increment/decrement (+1, -1, +10) controls.
  - Configurable low-stock threshold (default 5 units) with warning alert badges.
  - **Atomic Stock Decrement**: Units decrement automatically inside a database transaction upon verified payment.
- **Orders & Reports (`/dashboard/orders` & `/dashboard/reports`)**:
  - Filter orders by payment status (`paid`, `pending`, `failed`, `refunded`).
  - View order details and download individual tax invoice PDFs.
  - Daily & monthly sales analytics with custom date range pickers.
  - **CSV Export**: Stream standard spreadsheet containing full order metadata, taxes, discounts, and transaction IDs.
- **Subscription Management (`/dashboard/subscription`)**:
  - View current tier (*Starter*, *Pro Retailer*, *Enterprise*) and renewal countdown.
  - Simulated / live Razorpay subscription upgrade.
  - **Paywall Access Control**: If a store's subscription expires, the dashboard locks automatically with a renewal paywall modal.
- **Store Settings (`/dashboard/settings`)**:
  - Configure Store Name, Physical Address, Tax Rate (% GST), and Owner UPI VPA.

---

### 2. Customer Portal (`/scan`, `/cart`, `/checkout`, `/orders`)
- **In-Browser QR Scanner (`/scan`)**:
  - Live device camera scanner via `html5-qrcode` with torch/camera toggle.
  - Instant decode -> API fetch -> Cart addition -> Vibrant toast feedback.
  - **1-Click Test Scanner**: Built-in test simulator allowing instant scanning of sample products on desktop or when camera access is denied.
- **Smart Shopping Basket (`/cart`)**:
  - Thumbnail, unit price, and touch-friendly quantity adjusters (min 44px tap targets).
  - Real-time calculations: Subtotal, Store GST tax (`taxRate%`), and discount promo codes (`SAVE10` for 10% off, `QR50` for ₹50 off).
- **Bill Preview & UPI Checkout (`/checkout`)**:
  - Formal itemized invoice preview displaying store name, address, and merchant UPI VPA.
  - Razorpay UPI payment trigger with automated HMAC signature verification.
  - On success: Database creates `Order`, decrements stock, and triggers confirmation email.
- **Digital Tax Invoice & Receipt (`/checkout/success` & `/orders/[id]`)**:
  - Sequential invoice number format: `INV-{storeId}-{YYYYMMDD}-{sequence}`.
  - 1-click Download Tax Invoice (PDF) with full itemized breakdown, tax rates, and UPI transaction reference.
- **Order History (`/orders`)**:
  - Complete history of customer checkouts with status badges and PDF receipts.

---

## Quick Start & Setup

### Prerequisites
- Node.js 18+ or 20+
- npm

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default `.env` values (ready for instant zero-dependency testing):
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="qrshop_super_secret_session_jwt_key_2026_production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RAZORPAY_KEY_ID="rzp_test_mock_key_12345"
RAZORPAY_KEY_SECRET="mock_secret_key_67890"
```

### 3. Initialize & Seed Database
Sync the database schema and populate with realistic sample data:
```bash
npm run prisma:push
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts

| Role | Email | Password | Pre-configured Data |
| :--- | :--- | :--- | :--- |
| **Store Owner** | `owner@qrshop.com` | `password123` | "SuperMart Fresh & Daily", Indiranagar, Bengaluru. 6 products with live QR codes. |
| **Customer** | `customer@qrshop.com` | `password123` | Active customer profile with sample past orders. |

*Note: You can also use the 1-Click Demo Login buttons directly on the landing page or login screen.*

---

## End-to-End Verification Walkthrough

1. **Owner Setup**: Log in as `owner@qrshop.com`.
   - Go to **Products & QR** (`/dashboard/products`).
   - Click **Add New Product** -> Enter name, price, SKU, stock -> Click **Save Product**.
   - Notice the QR code is automatically generated! Click **View QR** to preview or download PNG.
   - Click **Export All QR Labels (PDF)** to download an A4 printable shelf label sheet.
2. **Customer Self-Checkout**: Open [http://localhost:3000/scan](http://localhost:3000/scan) (in a separate tab or mobile device).
   - Use the live camera or click any item under **Instant Scan Simulator** (e.g. *Organic Green Tea*).
   - A success toast confirms the item has been added to your cart.
   - Click **View Cart** -> Adjust quantity or apply coupon `SAVE10`.
   - Click **Proceed to Bill & Pay** -> Review the invoice preview.
   - Click **Pay via UPI** -> Click **Approve & Pay** in the Razorpay checkout simulator.
3. **Receipt & Stock Update**:
   - The checkout completes with an animated checkmark screen.
   - Click **Download Tax Invoice (PDF)** to view the official receipt.
   - Return to the Owner Dashboard -> Notice that product stock has decremented and Today's Sales has updated!

---

## Production Deployment (PostgreSQL + Vercel)

To deploy to production with PostgreSQL:
1. In `prisma/schema.prisma`, update `datasource db` provider to `"postgresql"` (a template is available in `prisma/schema.postgresql.prisma`).
2. Provide your production PostgreSQL connection string in `DATABASE_URL` (e.g., Supabase or Neon).
3. Run `npx prisma db push`.
4. Deploy to Vercel and add the environment variables in the Vercel dashboard.
