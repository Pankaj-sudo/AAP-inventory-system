// ─── Phase 1 & 2: Core Inventory ──────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  leadTimeDays: number;
}

export interface VehicleModel {
  id: string;
  make: string;      // e.g. Yamaha, Honda, Kawasaki, Suzuki
  model: string;     // e.g. YZF-R1, CB500X, Ninja 400
  year: string;      // e.g. 2018-2023, 2021
  engineCC: string;  // e.g. 998cc, 471cc, 399cc
}

export interface Part {
  id: string;
  sku: string;
  name: string;
  oemNumber: string;
  categoryId: string;
  supplierId: string;
  costPrice: number;
  wholesalePrice: number;
  salePrice: number;
  stockLevel: number;
  reorderPoint: number;
  maxStock: number;
  unit: string;
  binLocation: string;
  description: string;
  brand: string;
  barcode: string;
  imageUrl: string;
  compatibilityIds: string[];
}

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDelivery: string;
  totalAmount: number;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  partId: string;
  quantity: number;
  unitCost: number;
}

export type SalesOrderStatus = 'PENDING' | 'DISPATCHED' | 'DELIVERED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CREDIT_ACCOUNT' | 'QR_PAY';

export interface SalesOrder {
  id: string;
  customerId?: string;
  customerName: string;
  status: SalesOrderStatus;
  saleDate: string;
  totalAmount: number;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  taxRate?: number;
  paymentMethod?: PaymentMethod;
  invoiceId?: string;
  notes?: string;
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  partId: string;
  quantity: number;
  unitPrice: number;
}

// ─── Phase 2: History & Logging ───────────────────────────────────────────────

export type StockMovementType = 'PO_RECEIVED' | 'SALE_DISPATCHED' | 'MANUAL_ADJUST' | 'BULK_IMPORT' | 'RETURN_RESTOCK' | 'DAMAGE_WRITE_OFF';

export interface StockMovement {
  id: string;
  partId: string;
  type: StockMovementType;
  quantity: number;
  timestamp: string;
  referenceId: string;
  notes: string;
}

export interface ProductHistoryLog {
  id: string;
  partId: string;
  changeType: 'CREATED' | 'EDITED' | 'DELETED';
  timestamp: string;
  user: string;
  details: string;
}

// ─── Phase 4: Customer Management ────────────────────────────────────────────

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'TRADE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: CustomerType;
  notes: string;
  createdAt: string;
}

// ─── Phase 4: Invoices ────────────────────────────────────────────────────────

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID';
export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface InvoiceItem {
  partId: string;
  partName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  lineTotal: number;
  lineProfit: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  profit: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  status: InvoiceStatus;
}

// ─── Phase 4: Returns & Refunds ───────────────────────────────────────────────

export type ReturnType = 'REFUND' | 'EXCHANGE' | 'STORE_CREDIT';
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface ReturnItem {
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface Return {
  id: string;
  returnNumber: string;
  originalSalesOrderId: string;
  customerId: string;
  customerName: string;
  items: ReturnItem[];
  reason: string;
  type: ReturnType;
  status: ReturnStatus;
  refundAmount: number;
  restockItems: boolean;
  createdAt: string;
}

// ─── Phase 4: Damaged Stock ───────────────────────────────────────────────────

export interface DamagedStock {
  id: string;
  reportNumber: string;
  partId: string;
  partName: string;
  quantity: number;
  reason: string;
  reportedBy: string;
  timestamp: string;
  resolved: boolean;
  estimatedLoss: number;
}

// ─── Phase 4: Stock Adjustments ──────────────────────────────────────────────

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  partId: string;
  partName: string;
  previousQty: number;
  adjustedQty: number;
  delta: number;
  reason: string;
  type: 'ADDITION' | 'REDUCTION' | 'CORRECTION';
  adjustedBy: string;
  timestamp: string;
}

// ─── Phase 4: Notification System ────────────────────────────────────────────

export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'NEW_SALE'
  | 'RETURN'
  | 'PO_DELIVERY'
  | 'STOCK_ADJUST'
  | 'DAMAGED_STOCK';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
  priority: NotificationPriority;
  navigateTo?: string;
}

// ─── Helmets & Product Catalog Module ────────────────────────────────────────

export type HelmetCategory =
  | 'Full Face'
  | 'Open Face'
  | 'Modular'
  | 'Off Road'
  | 'Adventure'
  | 'Half Face'
  | 'Motocross'
  | 'Dual Sport';

export type HelmetBrand =
  | 'SMK'
  | 'LS2'
  | 'Steelbird'
  | 'Studds'
  | 'Axor'
  | 'MT'
  | 'AGV'
  | 'HJC'
  | 'Shoei'
  | 'Arai'
  | 'Others';

export interface Helmet {
  id: string;
  productName: string;
  brand: HelmetBrand | string;
  model: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  wholesalePrice: number;
  salePrice: number;
  stockLevel: number;
  reorderPoint: number;
  maxStock: number;
  weight: string;
  size: string;
  colour: string;
  category: HelmetCategory | string;
  gearType?: string; // Scalable for Gloves, Jackets, Boots, Raincoats, Luggage, Accessories (default: 'Helmets')
  description: string;
  imageUrl: string; // Google Drive Image URL or web image URL
  createdAt: string;
  updatedAt: string;
}

