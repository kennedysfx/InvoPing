import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Define PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  businessName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  businessDetails: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
    textAlign: "right",
    marginBottom: 4,
  },
  invoiceMetaText: {
    fontSize: 9,
    color: "#475569",
    textAlign: "right",
    lineHeight: 1.4,
  },
  billingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
  },
  billingBox: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  clientName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "right" },
  colRate: { width: "17%", textAlign: "right" },
  colAmount: { width: "18%", textAlign: "right" },

  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: "45%",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: "#475569",
  },
  totalValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
  },

  notesBox: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
});

export interface InvoicePdfData {
  business: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    logoUrl?: string | null;
  };
  client: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  invoice: {
    number: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    discountRate: string;
    discountAmount: string;
    total: string;
    amountPaid: string;
    balanceDue: string;
    status: string;
    notes?: string | null;
    paymentInstructions?: string | null;
  };
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    amount: string;
  }>;
  showBranding: boolean;
}

const InvoiceDocument: React.FC<{ data: InvoicePdfData }> = ({ data }) => {
  const { business, client, invoice, items, showBranding } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: "55%" }}>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.businessDetails}>
              {business.email}
              {business.phone ? ` • ${business.phone}` : ""}
              {business.address ? `\n${business.address}` : ""}
            </Text>
          </View>
          <View style={{ width: "40%" }}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMetaText}>
              Invoice #: {invoice.number}{"\n"}
              Issue Date: {invoice.issueDate}{"\n"}
              Due Date: {invoice.dueDate}{"\n"}
              Status: {invoice.status}
            </Text>
          </View>
        </View>

        {/* Billed To Section */}
        <View style={styles.billingSection}>
          <View style={styles.billingBox}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.company ? <Text style={styles.businessDetails}>{client.company}</Text> : null}
            {client.email ? <Text style={styles.businessDetails}>{client.email}</Text> : null}
            {client.phone ? <Text style={styles.businessDetails}>{client.phone}</Text> : null}
            {client.address ? <Text style={styles.businessDetails}>{client.address}</Text> : null}
          </View>
          <View style={styles.billingBox}>
            <Text style={styles.sectionTitle}>Payment Status</Text>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: invoice.balanceDue === "0.00" ? "#16a34a" : "#dc2626" }}>
              {invoice.balanceDue === "0.00" ? "PAID IN FULL" : `BALANCE DUE: ${invoice.currency} ${invoice.balanceDue}`}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Item Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate ({invoice.currency})</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount ({invoice.currency})</Text>
          </View>

          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.businessDetails, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.businessDetails, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.businessDetails, styles.colRate]}>{item.unitPrice}</Text>
              <Text style={[styles.businessDetails, styles.colAmount]}>{item.amount}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{invoice.currency} {invoice.subtotal}</Text>
            </View>
            {parseFloat(invoice.taxAmount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%):</Text>
                <Text style={styles.totalValue}>{invoice.currency} {invoice.taxAmount}</Text>
              </View>
            )}
            {parseFloat(invoice.discountAmount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount ({invoice.discountRate}%):</Text>
                <Text style={styles.totalValue}>-{invoice.currency} {invoice.discountAmount}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{invoice.currency} {invoice.total}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid:</Text>
              <Text style={styles.totalValue}>{invoice.currency} {invoice.amountPaid}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>Balance Due:</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#dc2626" }}>{invoice.currency} {invoice.balanceDue}</Text>
            </View>
          </View>
        </View>

        {/* Payment Instructions & Notes */}
        {invoice.paymentInstructions && (
          <View style={styles.notesBox}>
            <Text style={styles.sectionTitle}>Payment Instructions</Text>
            <Text style={styles.businessDetails}>{invoice.paymentInstructions}</Text>
          </View>
        )}

        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.businessDetails}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {showBranding
              ? "Created with InvoPing — Create invoices. Send on WhatsApp. Get paid."
              : `Thank you for your business with ${business.name}`}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  const element = React.createElement(InvoiceDocument, { data });
  // Render PDF document to a Node Buffer
  const buffer = await renderToBuffer(element as any);
  return buffer;
}
