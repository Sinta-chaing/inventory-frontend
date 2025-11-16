"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, Menu, AlertCircle } from "lucide-react"
import { getInventoryItems } from "@/lib/supabase-storage"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/navigation/sidebar"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InventoryItem } from "@/types"
import { useSidebarState } from "@/hooks/use-sidebar-state"

export default function InventoryPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState()
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setIsLoggedIn(true)
      setIsLoading(false)
      loadItems()
    }
    checkAuth()
  }, [])

  const loadItems = async () => {
    try {
      const loadedItems = await getInventoryItems()
      setItems(loadedItems)
      setDbError(null)
    } catch (error: any) {
      console.error("Error loading inventory:", error)
      if (error.message?.includes("Could not find the table") || error.code === "PGRST204") {
        setDbError("database_not_setup")
      } else {
        setDbError("unknown_error")
      }
    }
  }

  if (isLoading) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            {!isSidebarOpen && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="bg-white hover:bg-gray-50 text-gray-700 shadow-sm border flex-shrink-0"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-600 text-white flex-shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">
                Manage your stock, prices, and product details
              </p>
            </div>
          </div>
        </div>

        {dbError === "database_not_setup" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Not Set Up</AlertTitle>
            <AlertDescription>
              The inventory database table hasn't been created yet. Please run the SQL scripts from the sidebar to set
              up the database:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">scripts/001_create_inventory_table.sql</code>
                </li>
                <li>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">scripts/002_create_storage_bucket.sql</code>
                </li>
              </ol>
              <Button onClick={loadItems} variant="outline" size="sm" className="mt-3 bg-transparent">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {dbError === "unknown_error" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Inventory</AlertTitle>
            <AlertDescription>
              There was an error loading your inventory items. Please check your database connection and try again.
              <Button onClick={loadItems} variant="outline" size="sm" className="mt-3 bg-transparent">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <InventoryTable items={items} onUpdate={loadItems} />
      </main>
    </div>
  )
}
