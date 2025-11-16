"use client"

import { useState } from "react"
import type { InventoryItem } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Search } from "lucide-react"
import { InventoryDialog } from "./inventory-dialog"
import { deleteInventoryItem } from "@/lib/supabase-storage"
import Image from "next/image"

interface InventoryTableProps {
  items: InventoryItem[]
  onUpdate: () => void
}

export function InventoryTable({ items, onUpdate }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteInventoryItem(id)
      onUpdate()
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
  }

  const calculateFinalPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <InventoryDialog
          item={editingItem}
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingItem(null)
          }}
          onSuccess={() => {
            onUpdate()
            handleDialogClose()
          }}
        />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-16">
              <TableHead className="text-base">Image</TableHead>
              <TableHead className="text-base">SKU</TableHead>
              <TableHead className="text-base">Name</TableHead>
              <TableHead className="text-base">Category</TableHead>
              <TableHead className="text-right text-base">Price</TableHead>
              <TableHead className="text-right text-base">Discount</TableHead>
              <TableHead className="text-right text-base">Final Price</TableHead>
              <TableHead className="text-right text-base">Stock</TableHead>
              <TableHead className="text-right text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="h-24">
                  <TableCell className="py-4">
                    <div className="w-20 h-20 relative rounded overflow-hidden bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-base py-4">{item.sku}</TableCell>
                  <TableCell className="py-4">
                    <div>
                      <div className="font-medium text-base">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-base py-4">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right py-4">
                    {item.discount > 0 ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-sm px-3 py-1">
                        {item.discount}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-base py-4">
                    ${calculateFinalPrice(item.price, item.discount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <Badge
                      variant={item.stock <= item.minStock ? "destructive" : "default"}
                      className={`text-sm px-3 py-1 ${item.stock <= item.minStock ? "" : "bg-blue-600"}`}
                    >
                      {item.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleEdit(item)}>
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
