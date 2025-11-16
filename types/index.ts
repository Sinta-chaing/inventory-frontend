export interface InventoryItem {
  id: string
  name: string
  description: string
  sku: string
  category: string
  price: number
  discount: number // percentage
  stock: number
  minStock: number // for low stock alerts
  imageUrl?: string // renamed from image to imageUrl for clarity
  userId?: string // added userId for RLS
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  inventoryItemId: string
  name: string
  sku: string
  quantity: number
  price: number
  discount: number
  total: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: "draft" | "paid" | "cancelled"
  createdAt: string
  updatedAt: string
}

export interface SalesData {
  itemId: string
  itemName: string
  totalQuantity: number
  totalRevenue: number
  invoiceCount: number
}

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  lastTransactionDate?: string
  createdAt: string
  updatedAt: string
  userId?: string
}

export interface PurchaseOrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName?: string
  orderDate: string
  expectedDeliveryDate?: string
  status: "pending" | "received" | "cancelled"
  items: PurchaseOrderItem[]
  totalAmount: number
  notes?: string
  receivedDate?: string
  createdAt: string
  updatedAt: string
  userId?: string
}
