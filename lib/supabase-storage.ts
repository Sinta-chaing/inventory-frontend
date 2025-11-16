import { createClient } from "@/lib/supabase/client"
import type { InventoryItem, Supplier, PurchaseOrder } from "@/types"

// Client-side functions
export async function getInventoryItems(): Promise<InventoryItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("inventory_items").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching inventory items:", error)
    throw error
  }

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    sku: item.sku,
    category: item.category,
    price: item.price,
    discount: item.discount,
    stock: item.stock,
    minStock: item.min_stock,
    imageUrl: item.image_url,
    userId: item.user_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

export async function addInventoryItem(
  item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "userId">,
): Promise<InventoryItem | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error("User not authenticated")
    return null
  }

  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      name: item.name,
      description: item.description,
      sku: item.sku,
      category: item.category,
      price: item.price,
      discount: item.discount,
      stock: item.stock,
      min_stock: item.minStock,
      image_url: item.imageUrl,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding inventory item:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    sku: data.sku,
    category: data.category,
    price: data.price,
    discount: data.discount,
    stock: data.stock,
    minStock: data.min_stock,
    imageUrl: data.image_url,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "userId">>,
): Promise<InventoryItem | null> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.sku !== undefined) updateData.sku = updates.sku
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.price !== undefined) updateData.price = updates.price
  if (updates.discount !== undefined) updateData.discount = updates.discount
  if (updates.stock !== undefined) updateData.stock = updates.stock
  if (updates.minStock !== undefined) updateData.min_stock = updates.minStock
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl

  const { data, error } = await supabase.from("inventory_items").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating inventory item:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    sku: data.sku,
    category: data.category,
    price: data.price,
    discount: data.discount,
    stock: data.stock,
    minStock: data.min_stock,
    imageUrl: data.image_url,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const supabase = createClient()

  // First, get the item to check if it has an image
  const { data: item } = await supabase.from("inventory_items").select("image_url").eq("id", id).single()

  // Delete the image from storage if it exists
  if (item?.image_url) {
    const fileName = item.image_url.split("/").pop()
    if (fileName) {
      await supabase.storage.from("product-images").remove([fileName])
    }
  }

  const { error } = await supabase.from("inventory_items").delete().eq("id", id)

  if (error) {
    console.error("Error deleting inventory item:", error)
    return false
  }

  return true
}

export async function uploadProductImage(file: File): Promise<string | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage.from("product-images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Error uploading image:", error)
    return null
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(data.path)

  return publicUrl
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  const supabase = createClient()

  const fileName = imageUrl.split("/").pop()
  if (!fileName) return false

  const { error } = await supabase.storage.from("product-images").remove([fileName])

  if (error) {
    console.error("Error deleting image:", error)
    return false
  }

  return true
}

// Invoice Operations
export async function getInvoices(): Promise<any[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      invoice_items (
        id,
        inventory_item_id,
        name,
        quantity,
        price,
        discount,
        total
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching invoices:", error)
    throw error
  }

  return data.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    customerName: invoice.customer_name,
    customerEmail: invoice.customer_email,
    customerAddress: invoice.customer_address,
    status: invoice.status,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    notes: invoice.notes,
    items: invoice.invoice_items.map((item: any) => ({
      id: item.id,
      inventoryItemId: item.inventory_item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      total: item.total,
    })),
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
  }))
}

export async function addInvoice(invoice: any): Promise<any | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Check stock availability
  for (const item of invoice.items) {
    const { data: inventoryItem } = await supabase
      .from("inventory_items")
      .select("stock")
      .eq("id", item.inventoryItemId)
      .single()

    if (!inventoryItem || inventoryItem.stock < item.quantity) {
      console.error("Insufficient stock for item:", item.name)
      return null
    }
  }

  // Generate invoice number
  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true })
  const invoiceNumber = `INV-${String((count || 0) + 1).padStart(5, "0")}`

  // Create invoice
  const { data: newInvoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      invoice_number: invoiceNumber,
      customer_name: invoice.customerName,
      customer_email: invoice.customerEmail,
      customer_address: invoice.customerAddress,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      notes: invoice.notes,
    })
    .select()
    .single()

  if (invoiceError) {
    console.error("Error creating invoice:", invoiceError)
    return null
  }

  // Create invoice items and reduce stock
  for (const item of invoice.items) {
    // Insert invoice item
    const { error: itemError } = await supabase.from("invoice_items").insert({
      invoice_id: newInvoice.id,
      inventory_item_id: item.inventoryItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      total: item.total,
    })

    if (itemError) {
      console.error("Error creating invoice item:", itemError)
      return null
    }

    // Reduce stock
    const { data: inventoryItem } = await supabase
      .from("inventory_items")
      .select("stock")
      .eq("id", item.inventoryItemId)
      .single()

    if (inventoryItem) {
      await supabase
        .from("inventory_items")
        .update({ stock: inventoryItem.stock - item.quantity })
        .eq("id", item.inventoryItemId)
    }
  }

  // Fetch the complete invoice with items
  const { data: completeInvoice } = await supabase
    .from("invoices")
    .select(`
      *,
      invoice_items (
        id,
        inventory_item_id,
        name,
        quantity,
        price,
        discount,
        total
      )
    `)
    .eq("id", newInvoice.id)
    .single()

  return {
    id: completeInvoice.id,
    invoiceNumber: completeInvoice.invoice_number,
    customerName: completeInvoice.customer_name,
    customerEmail: completeInvoice.customer_email,
    customerAddress: completeInvoice.customer_address,
    status: completeInvoice.status,
    subtotal: completeInvoice.subtotal,
    tax: completeInvoice.tax,
    total: completeInvoice.total,
    notes: completeInvoice.notes,
    items: completeInvoice.invoice_items.map((item: any) => ({
      id: item.id,
      inventoryItemId: item.inventory_item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      total: item.total,
    })),
    createdAt: completeInvoice.created_at,
    updatedAt: completeInvoice.updated_at,
  }
}

export async function updateInvoice(id: string, updates: any): Promise<any | null> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}
  if (updates.customerName !== undefined) updateData.customer_name = updates.customerName
  if (updates.customerEmail !== undefined) updateData.customer_email = updates.customerEmail
  if (updates.customerAddress !== undefined) updateData.customer_address = updates.customerAddress
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal
  if (updates.tax !== undefined) updateData.tax = updates.tax
  if (updates.total !== undefined) updateData.total = updates.total
  if (updates.notes !== undefined) updateData.notes = updates.notes

  const { data, error } = await supabase.from("invoices").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating invoice:", error)
    return null
  }

  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerAddress: data.customer_address,
    status: data.status,
    subtotal: data.subtotal,
    tax: data.tax,
    total: data.total,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("invoices").delete().eq("id", id)

  if (error) {
    console.error("Error deleting invoice:", error)
    return false
  }

  return true
}

// Supplier CRUD operations
export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching suppliers:", error)
    throw error
  }

  return data.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    contactPerson: supplier.contact_person,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    notes: supplier.notes,
    lastTransactionDate: supplier.last_transaction_date,
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
    userId: supplier.user_id,
  }))
}

export async function addSupplier(
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "userId">,
): Promise<Supplier | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error("User not authenticated")
    return null
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: supplier.name,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding supplier:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: data.phone,
    address: data.address,
    notes: data.notes,
    lastTransactionDate: data.last_transaction_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userId: data.user_id,
  }
}

export async function updateSupplier(
  id: string,
  updates: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt" | "userId">>,
): Promise<Supplier | null> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.contactPerson !== undefined) updateData.contact_person = updates.contactPerson
  if (updates.email !== undefined) updateData.email = updates.email
  if (updates.phone !== undefined) updateData.phone = updates.phone
  if (updates.address !== undefined) updateData.address = updates.address
  if (updates.notes !== undefined) updateData.notes = updates.notes
  if (updates.lastTransactionDate !== undefined) updateData.last_transaction_date = updates.lastTransactionDate

  const { data, error } = await supabase.from("suppliers").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating supplier:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: data.phone,
    address: data.address,
    notes: data.notes,
    lastTransactionDate: data.last_transaction_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userId: data.user_id,
  }
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("suppliers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting supplier:", error)
    return false
  }

  return true
}

// Purchase Order CRUD operations
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      suppliers (
        name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching purchase orders:", error)
    throw error
  }

  return data.map((po: any) => ({
    id: po.id,
    poNumber: po.po_number,
    supplierId: po.supplier_id,
    supplierName: po.suppliers?.name,
    orderDate: po.order_date,
    expectedDeliveryDate: po.expected_delivery_date,
    status: po.status,
    items: po.items || [],
    totalAmount: po.total_amount,
    notes: po.notes,
    receivedDate: po.received_date,
    createdAt: po.created_at,
    updatedAt: po.updated_at,
    userId: po.user_id,
  }))
}

async function updateInventoryFromPO(supabase: any, items: any[], supplierId: string) {
  // Update inventory stock for each item
  for (const item of items) {
    const { data: inventoryItem } = await supabase
      .from("inventory_items")
      .select("stock")
      .eq("id", item.productId)
      .single()

    if (inventoryItem) {
      await supabase
        .from("inventory_items")
        .update({ stock: inventoryItem.stock + item.quantity })
        .eq("id", item.productId)
    }
  }

  // Update supplier's last transaction date
  await supabase.from("suppliers").update({ last_transaction_date: new Date().toISOString() }).eq("id", supplierId)
}

export async function addPurchaseOrder(
  po: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "updatedAt" | "userId">,
): Promise<PurchaseOrder | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error("User not authenticated")
    return null
  }

  const timestamp = Date.now().toString().slice(-5)
  const poNumber = `PO-${timestamp}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

  const insertData: any = {
    po_number: poNumber,
    supplier_id: po.supplierId,
    order_date: po.orderDate,
    expected_delivery_date: po.expectedDeliveryDate,
    status: po.status,
    items: po.items,
    total_amount: po.totalAmount,
    notes: po.notes,
    user_id: user.id,
  }

  if (po.status === "received") {
    insertData.received_date = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert(insertData)
    .select(`
      *,
      suppliers (
        name
      )
    `)
    .single()

  if (error) {
    console.error("Error adding purchase order:", error)
    return null
  }

  if (po.status === "received" && po.items && po.items.length > 0) {
    await updateInventoryFromPO(supabase, po.items, po.supplierId)
  }

  return {
    id: data.id,
    poNumber: data.po_number,
    supplierId: data.supplier_id,
    supplierName: data.suppliers?.name,
    orderDate: data.order_date,
    expectedDeliveryDate: data.expected_delivery_date,
    status: data.status,
    items: data.items || [],
    totalAmount: data.total_amount,
    notes: data.notes,
    receivedDate: data.received_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userId: data.user_id,
  }
}

export async function updatePurchaseOrder(
  id: string,
  updates: Partial<Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "updatedAt" | "userId">>,
): Promise<PurchaseOrder | null> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId
  if (updates.orderDate !== undefined) updateData.order_date = updates.orderDate
  if (updates.expectedDeliveryDate !== undefined) updateData.expected_delivery_date = updates.expectedDeliveryDate
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.items !== undefined) updateData.items = updates.items
  if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount
  if (updates.notes !== undefined) updateData.notes = updates.notes
  if (updates.receivedDate !== undefined) updateData.received_date = updates.receivedDate

  if (updates.status === "received") {
    updateData.received_date = new Date().toISOString()

    // Get the PO to access items
    const { data: po } = await supabase.from("purchase_orders").select("items, supplier_id").eq("id", id).single()

    if (po && po.items && po.items.length > 0) {
      await updateInventoryFromPO(supabase, po.items, po.supplier_id)
    }
  }

  const { data, error } = await supabase
    .from("purchase_orders")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      suppliers (
        name
      )
    `)
    .single()

  if (error) {
    console.error("Error updating purchase order:", error)
    return null
  }

  return {
    id: data.id,
    poNumber: data.po_number,
    supplierId: data.supplier_id,
    supplierName: data.suppliers?.name,
    orderDate: data.order_date,
    expectedDeliveryDate: data.expected_delivery_date,
    status: data.status,
    items: data.items || [],
    totalAmount: data.total_amount,
    notes: data.notes,
    receivedDate: data.received_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userId: data.user_id,
  }
}

export async function deletePurchaseOrder(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("purchase_orders").delete().eq("id", id)

  if (error) {
    console.error("Error deleting purchase order:", error)
    return false
  }

  return true
}
