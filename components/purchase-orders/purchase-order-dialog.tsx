"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PurchaseOrderForm } from "./purchase-order-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { PurchaseOrder } from "@/types"

interface PurchaseOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingPO?: PurchaseOrder
}

export function PurchaseOrderDialog({ isOpen, onClose, onSuccess, editingPO }: PurchaseOrderDialogProps) {
  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 md:p-8">
        <DialogHeader className="flex flex-row items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs sm:text-sm h-8 px-2">
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Back
          </Button>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">
            {editingPO ? "Edit Purchase Order" : "Create New Purchase Order"}
          </DialogTitle>
          {/* Spacer to balance the layout */}
          <div className="w-16" />
        </DialogHeader>
        <PurchaseOrderForm onSuccess={handleSuccess} onCancel={onClose} editingPO={editingPO} />
      </DialogContent>
    </Dialog>
  )
}
