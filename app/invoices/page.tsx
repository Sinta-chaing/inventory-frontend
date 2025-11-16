"use client"

import { useState, useEffect } from "react"
import type { Invoice } from "@/types"
import { getInvoices } from "@/lib/supabase-storage"
import { InvoiceList } from "@/components/invoice/invoice-list"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Menu } from "lucide-react"
import Link from "next/link"
import { Sidebar } from "@/components/navigation/sidebar"
import { useSidebarState } from "@/hooks/use-sidebar-state"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [mounted, setMounted] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const loadedInvoices = await getInvoices()
      setInvoices(loadedInvoices)
    } catch (error) {
      console.error("Error loading invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
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
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-600 text-white flex-shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invoices</h1>
              <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
                Manage and export your invoices
              </p>
            </div>
          </div>
          <Link href="/invoices/create" className="w-full sm:w-auto">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        ) : (
          <InvoiceList invoices={invoices} onUpdate={loadInvoices} />
        )}
      </main>
    </div>
  )
}
