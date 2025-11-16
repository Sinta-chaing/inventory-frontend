"use client"

import { useRef } from "react"
import type { Invoice } from "@/types"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface InvoicePreviewProps {
  invoice: Invoice
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  const exportToPDF = async () => {
    if (!invoiceRef.current) return

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
    pdf.save(`${invoice.invoiceNumber}.pdf`)
  }

  const exportToPNG = async () => {
    if (!invoiceRef.current) return

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    })

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${invoice.invoiceNumber}.png`
        link.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={exportToPDF} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button onClick={exportToPNG} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export PNG
        </Button>
      </div>

      <div
        ref={invoiceRef}
        style={{
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#2563eb", marginBottom: "0.5rem" }}>
            INVOICE
          </h1>
          <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
            <p style={{ fontFamily: "monospace", fontWeight: "500" }}>{invoice.invoiceNumber}</p>
            <p>Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
          <div>
            <h3 style={{ fontWeight: "600", color: "#111827", marginBottom: "0.5rem" }}>Bill To:</h3>
            <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <p style={{ fontWeight: "500", color: "#111827" }}>{invoice.customerName}</p>
              <p>{invoice.customerEmail}</p>
              <p>{invoice.customerPhone}</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3 style={{ fontWeight: "600", color: "#111827", marginBottom: "0.5rem" }}>From:</h3>
            <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <p style={{ fontWeight: "500", color: "#111827" }}>Your Company Name</p>
              <p>123 Business Street</p>
              <p>City, State 12345</p>
            </div>
          </div>
        </div>

        <table style={{ width: "100%", marginBottom: "2rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #d1d5db" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Item
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Price
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Discount
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.75rem 0", fontSize: "0.875rem" }}>
                  <div style={{ fontWeight: "500", color: "#111827" }}>{item.name}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{item.sku}</div>
                </td>
                <td style={{ textAlign: "right", padding: "0.75rem 0", fontSize: "0.875rem", color: "#4b5563" }}>
                  {item.quantity}
                </td>
                <td style={{ textAlign: "right", padding: "0.75rem 0", fontSize: "0.875rem", color: "#4b5563" }}>
                  ${item.price.toFixed(2)}
                </td>
                <td style={{ textAlign: "right", padding: "0.75rem 0", fontSize: "0.875rem", color: "#4b5563" }}>
                  {item.discount}%
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "0.75rem 0",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  ${item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "16rem" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              <span style={{ color: "#4b5563" }}>Subtotal:</span>
              <span style={{ fontWeight: "500", color: "#111827" }}>${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#4b5563" }}>Discount:</span>
                <span style={{ fontWeight: "500", color: "#dc2626" }}>-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div
              style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              <span style={{ color: "#4b5563" }}>Tax:</span>
              <span style={{ fontWeight: "500", color: "#111827" }}>${invoice.tax.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.125rem",
                fontWeight: "bold",
                borderTop: "2px solid #d1d5db",
                paddingTop: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <span style={{ color: "#111827" }}>Total:</span>
              <span style={{ color: "#2563eb" }}>${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#6b7280",
          }}
        >
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}
