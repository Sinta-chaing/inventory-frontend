"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Search, CheckCircle } from "lucide-react"
import { PurchaseOrderDialog } from "./purchase-order-dialog"
import { deletePurchaseOrder, updatePurchaseOrder } from "@/lib/supabase-storage"
import type { PurchaseOrder } from "@/types"

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[]
  onUpdate: () => void
}

export function PurchaseOrderTable({ purchaseOrders, onUpdate }: PurchaseOrderTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | undefined>()

  const filteredPOs = purchaseOrders.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO(po)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      await deletePurchaseOrder(id)
      onUpdate()
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingPO(undefined)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "received":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleMarkAsReceived = async (po: PurchaseOrder) => {
    if (po.status === "received") {
      alert("This purchase order has already been received.")
      return
    }

    if (confirm(`Mark purchase order ${po.poNumber} as received? This will update inventory stock levels.`)) {
      const result = await updatePurchaseOrder(po.id, {
        status: "received",
        receivedDate: new Date().toISOString(),
      })

      if (result) {
        alert("Purchase order marked as received. Inventory has been updated.")
        onUpdate()
      } else {
        alert("Failed to update purchase order. Please try again.")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">PO Number</TableHead>
              <TableHead className="font-semibold">Supplier</TableHead>
              <TableHead className="font-semibold">Order Date</TableHead>
              <TableHead className="font-semibold">Expected Delivery</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Total Amount</TableHead>
              <TableHead className="font-semibold">Items</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No purchase orders found. Create your first purchase order to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredPOs.map((po) => (
                <TableRow key={po.id} className="h-24">
                  <TableCell className="font-medium text-base">{po.poNumber}</TableCell>
                  <TableCell className="text-base">{po.supplierName || "N/A"}</TableCell>
                  <TableCell className="text-base">{formatDate(po.orderDate)}</TableCell>
                  <TableCell className="text-base">{formatDate(po.expectedDeliveryDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(po.status)} text-sm px-3 py-1`}>
                      {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-base">${po.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-base">{po.items.length} items</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {po.status === "pending" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMarkAsReceived(po)}
                          className="h-10 w-10 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Mark as Received"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => handleEdit(po)} className="h-10 w-10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(po.id)}
                        className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PurchaseOrderDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={onUpdate}
        editingPO={editingPO}
      />
    </div>
  )
}
