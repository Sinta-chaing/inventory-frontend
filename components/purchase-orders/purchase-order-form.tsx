"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { addPurchaseOrder, updatePurchaseOrder, getSuppliers, getInventoryItems } from "@/lib/supabase-storage"
import type { PurchaseOrder, Supplier, InventoryItem } from "@/types"

interface PurchaseOrderFormProps {
  onSuccess: () => void
  onCancel: () => void
  editingPO?: PurchaseOrder
}

interface POItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export function PurchaseOrderForm({ onSuccess, onCancel, editingPO }: PurchaseOrderFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [supplierId, setSupplierId] = useState(editingPO?.supplierId || "")
  const [orderDate, setOrderDate] = useState(editingPO?.orderDate || new Date().toISOString().split("T")[0])
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    editingPO?.expectedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  )
  const [status, setStatus] = useState(editingPO?.status || "pending")
  const [items, setItems] = useState<POItem[]>(editingPO?.items || [])
  const [notes, setNotes] = useState(editingPO?.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [loadedSuppliers, loadedItems] = await Promise.all([getSuppliers(), getInventoryItems()])
      setSuppliers(loadedSuppliers)
      setInventoryItems(loadedItems)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const addItem = () => {
    setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    const newItems = [...items]
    if (field === "productId") {
      const product = inventoryItems.find((item) => item.id === value)
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
        }
      }
    } else {
      if (field === "quantity" || field === "unitPrice") {
        const stringValue = value as string
        if (stringValue === "") {
          newItems[index] = { ...newItems[index], [field]: 0 }
        } else {
          const numValue = field === "quantity" ? Number.parseInt(stringValue) : Number.parseFloat(stringValue)
          newItems[index] = { ...newItems[index], [field]: isNaN(numValue) ? 0 : numValue }
        }
      } else {
        newItems[index] = { ...newItems[index], [field]: value }
      }
    }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const poData = {
        supplierId,
        orderDate,
        expectedDeliveryDate,
        status,
        items,
        totalAmount: calculateTotal(),
        notes,
      }

      if (editingPO) {
        await updatePurchaseOrder(editingPO.id, poData)
      } else {
        await addPurchaseOrder(poData)
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving purchase order:", error)
      alert("Failed to save purchase order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId} required>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Expected Delivery *</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">Items</CardTitle>
          <Button type="button" onClick={addItem} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => updateItem(index, "productId", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      placeholder="0"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice === 0 ? "" : item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                        placeholder="0.00"
                        required
                        className="text-sm sm:text-base"
                      />
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t mt-3">
                  <div className="text-sm font-medium">
                    Subtotal:{" "}
                    <span className="text-base font-semibold">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No items added yet. Click "Add Item" to start.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-orange-600">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
        >
          {isSubmitting ? "Saving..." : editingPO ? "Update Purchase Order" : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  )
}
