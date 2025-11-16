import type { InventoryItem, Invoice } from "@/types"

const INVENTORY_KEY = "inventory_items"
const INVOICES_KEY = "invoices"

// Inventory Operations
export const getInventoryItems = (): InventoryItem[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(INVENTORY_KEY)
  return data ? JSON.parse(data) : []
}

export const saveInventoryItems = (items: InventoryItem[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items))
}

export const addInventoryItem = (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">): InventoryItem => {
  const items = getInventoryItems()
  const newItem: InventoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  items.push(newItem)
  saveInventoryItems(items)
  return newItem
}

export const updateInventoryItem = (id: string, updates: Partial<InventoryItem>): InventoryItem | null => {
  const items = getInventoryItems()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return null

  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveInventoryItems(items)
  return items[index]
}

export const deleteInventoryItem = (id: string): boolean => {
  const items = getInventoryItems()
  const filtered = items.filter((item) => item.id !== id)
  if (filtered.length === items.length) return false
  saveInventoryItems(filtered)
  return true
}

export const updateStock = (id: string, quantity: number): boolean => {
  const items = getInventoryItems()
  const item = items.find((item) => item.id === id)
  if (!item || item.stock < quantity) return false

  item.stock -= quantity
  item.updatedAt = new Date().toISOString()
  saveInventoryItems(items)
  return true
}

// Invoice Operations
export const getInvoices = (): Invoice[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(INVOICES_KEY)
  return data ? JSON.parse(data) : []
}

export const saveInvoices = (invoices: Invoice[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
}

export const addInvoice = (
  invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">,
): Invoice | null => {
  // Check stock availability
  const items = getInventoryItems()
  for (const invoiceItem of invoice.items) {
    const inventoryItem = items.find((item) => item.id === invoiceItem.inventoryItemId)
    if (!inventoryItem || inventoryItem.stock < invoiceItem.quantity) {
      return null
    }
  }

  // Reduce stock
  for (const invoiceItem of invoice.items) {
    updateStock(invoiceItem.inventoryItemId, invoiceItem.quantity)
  }

  const invoices = getInvoices()
  const invoiceNumber = `INV-${String(invoices.length + 1).padStart(5, "0")}`

  const newInvoice: Invoice = {
    ...invoice,
    id: crypto.randomUUID(),
    invoiceNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  invoices.push(newInvoice)
  saveInvoices(invoices)
  return newInvoice
}

export const updateInvoice = (id: string, updates: Partial<Invoice>): Invoice | null => {
  const invoices = getInvoices()
  const index = invoices.findIndex((invoice) => invoice.id === id)
  if (index === -1) return null

  invoices[index] = {
    ...invoices[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveInvoices(invoices)
  return invoices[index]
}

export const deleteInvoice = (id: string): boolean => {
  const invoices = getInvoices()
  const filtered = invoices.filter((invoice) => invoice.id !== id)
  if (filtered.length === invoices.length) return false
  saveInvoices(filtered)
  return true
}

// Initialize with sample data if empty
export const initializeData = (): void => {
  if (typeof window === "undefined") return

  const items = getInventoryItems()
  if (items.length === 0) {
    const sampleItems: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">[] = [
      {
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse with USB receiver",
        sku: "WM-001",
        category: "Electronics",
        price: 29.99,
        discount: 0,
        stock: 150,
        minStock: 20,
      },
      {
        name: "Mechanical Keyboard",
        description: "RGB mechanical keyboard with blue switches",
        sku: "KB-002",
        category: "Electronics",
        price: 89.99,
        discount: 10,
        stock: 75,
        minStock: 15,
      },
      {
        name: "USB-C Cable",
        description: "6ft USB-C to USB-C charging cable",
        sku: "CB-003",
        category: "Accessories",
        price: 12.99,
        discount: 0,
        stock: 200,
        minStock: 50,
      },
      {
        name: "Laptop Stand",
        description: "Adjustable aluminum laptop stand",
        sku: "LS-004",
        category: "Accessories",
        price: 45.99,
        discount: 15,
        stock: 45,
        minStock: 10,
      },
      {
        name: "Webcam HD",
        description: "1080p HD webcam with built-in microphone",
        sku: "WC-005",
        category: "Electronics",
        price: 69.99,
        discount: 5,
        stock: 30,
        minStock: 10,
      },
    ]

    sampleItems.forEach((item) => addInventoryItem(item))
  }
}
