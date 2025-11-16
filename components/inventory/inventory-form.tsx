"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { InventoryItem } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadProductImage, deleteProductImage } from "@/lib/supabase-storage"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface InventoryFormProps {
  item?: InventoryItem | null
  onSubmit: (data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "userId">) => void
  onCancel: () => void
}

export function InventoryForm({ item, onSubmit, onCancel }: InventoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    category: "",
    price: "",
    discount: "",
    stock: "",
    minStock: "",
    imageUrl: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        sku: item.sku,
        category: item.category,
        price: item.price.toString(),
        discount: item.discount.toString(),
        stock: item.stock.toString(),
        minStock: item.minStock.toString(),
        imageUrl: item.imageUrl || "",
      })
      setImagePreview(item.imageUrl || "")
    }
  }, [item])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = async () => {
    if (formData.imageUrl && !imageFile) {
      // Delete from storage if it's an existing image
      await deleteProductImage(formData.imageUrl)
    }
    setImageFile(null)
    setImagePreview("")
    setFormData({ ...formData, imageUrl: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    let imageUrl = formData.imageUrl

    // Upload new image if selected
    if (imageFile) {
      // Delete old image if exists
      if (formData.imageUrl) {
        await deleteProductImage(formData.imageUrl)
      }

      const uploadedUrl = await uploadProductImage(imageFile)
      if (uploadedUrl) {
        imageUrl = uploadedUrl
      }
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      sku: formData.sku,
      category: formData.category,
      price: Number.parseFloat(formData.price),
      discount: Number.parseFloat(formData.discount),
      stock: Number.parseInt(formData.stock),
      minStock: Number.parseInt(formData.minStock),
      imageUrl: imageUrl || undefined,
    })

    setIsUploading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="image">Product Image</Label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative w-32 h-32 rounded-lg border overflow-hidden">
              <Image src={imagePreview || "/placeholder.svg"} alt="Product preview" fill className="object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-2">Upload Image</span>
            </label>
          )}
          <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discount">Discount (%)</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minStock">Minimum Stock (Low Stock Alert)</Label>
        <Input
          id="minStock"
          type="number"
          min="0"
          value={formData.minStock}
          onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUploading}>
          {isUploading ? "Uploading..." : item ? "Update Item" : "Add Item"}
        </Button>
      </div>
    </form>
  )
}
