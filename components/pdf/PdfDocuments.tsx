"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { businessInfo, money } from "@/lib/format";
import type { PrintableInvoice, PrintableStatement } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    color: "#111111",
    fontFamily: "Helvetica"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 16,
    marginBottom: 20
  },
  businessName: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6
  },
  muted: {
    color: "#555555",
    lineHeight: 1.4
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: "right",
    marginBottom: 6
  },
  section: {
    marginBottom: 18
  },
  row: {
    flexDirection: "row"
  },
  billTo: {
    width: "55%"
  },
  meta: {
    width: "45%",
    alignItems: "flex-end"
  },
  label: {
    fontSize: 8,
    color: "#555555",
    textTransform: "uppercase",
    marginBottom: 4
  },
  table: {
    borderWidth: 1,
    borderColor: "#222222"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eeeeee",
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
    fontWeight: 700
  },
  cell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#cccccc"
  },
  lastCell: {
    padding: 5
  },
  description: {
    width: "46%"
  },
  qty: {
    width: "14%",
    textAlign: "right"
  },
  price: {
    width: "20%",
    textAlign: "right"
  },
  total: {
    width: "20%",
    textAlign: "right"
  },
  totals: {
    marginTop: 16,
    marginLeft: "58%",
    borderTopWidth: 1,
    borderTopColor: "#222222"
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 7
  },
  grandTotal: {
    fontSize: 13,
    fontWeight: 700
  },
  notes: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#cccccc",
    padding: 8,
    marginTop: 20
  }
});

function Header({ title }: { title: string }) {
  const business = businessInfo();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.businessName}>{business.name}</Text>
        <Text style={styles.muted}>{business.address}</Text>
        <Text style={styles.muted}>{business.contact}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function CustomerBlock({ customer }: { customer: PrintableInvoice["customer"] }) {
  return (
    <View>
      <Text style={styles.label}>Customer</Text>
      <Text>{customer.name}</Text>
      {customer.company_name ? <Text>{customer.company_name}</Text> : null}
      {customer.address ? <Text>{customer.address}</Text> : null}
      {customer.phone ? <Text>{customer.phone}</Text> : null}
      {customer.email ? <Text>{customer.email}</Text> : null}
    </View>
  );
}

function CompanyBlock({ company }: { company: PrintableStatement["company"] }) {
  return (
    <View>
      <Text style={styles.label}>Company</Text>
      <Text>{company.name}</Text>
      {company.address ? <Text>{company.address}</Text> : null}
      {company.phone ? <Text>{company.phone}</Text> : null}
      {company.email ? <Text>{company.email}</Text> : null}
    </View>
  );
}

export function InvoiceDocument({ invoice }: { invoice: PrintableInvoice }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header title="INVOICE" />
        <View style={[styles.row, styles.section]}>
          <View style={styles.billTo}>
            <CustomerBlock customer={invoice.customer} />
          </View>
          <View style={styles.meta}>
            <Text>Invoice #: {invoice.invoice_number}</Text>
            <Text>Invoice date: {invoice.invoice_date}</Text>
            <Text>Status: {invoice.status}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.description]}>Service + patient</Text>
            <Text style={[styles.cell, styles.qty]}>Qty</Text>
            <Text style={[styles.cell, styles.price]}>Unit price</Text>
            <Text style={[styles.lastCell, styles.total]}>Line total</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View style={styles.row} key={`${item.description}-${index}`}>
              <Text style={[styles.cell, styles.description]}>
                {item.patient_name ? `${item.description} - ${item.patient_name}` : item.description}
              </Text>
              <Text style={[styles.cell, styles.qty]}>{item.quantity}</Text>
              <Text style={[styles.cell, styles.price]}>{money(item.unit_price)}</Text>
              <Text style={[styles.lastCell, styles.total]}>{money(item.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{money(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.grandTotal}>Total amount due</Text>
            <Text style={styles.grandTotal}>{money(invoice.total)}</Text>
          </View>
        </View>

        <View style={styles.notes}>
          <Text style={styles.label}>Notes</Text>
          <Text>{invoice.notes || "Thank you for your business."}</Text>
        </View>
      </Page>
    </Document>
  );
}

export function StatementDocument({ statement }: { statement: PrintableStatement }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header title="STATEMENT" />
        <View style={[styles.row, styles.section]}>
          <View style={styles.billTo}>
            <CompanyBlock company={statement.company} />
          </View>
          <View style={styles.meta}>
            <Text>Statement #: {statement.statement_number}</Text>
            <Text>Start date: {statement.start_date}</Text>
            <Text>End date: {statement.end_date}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { width: "16%" }]}>Invoice #</Text>
            <Text style={[styles.cell, { width: "13%" }]}>Date</Text>
            <Text style={[styles.cell, { width: "33%" }]}>Patient</Text>
            <Text style={[styles.cell, { width: "12%", textAlign: "right" }]}>Total</Text>
            <Text style={[styles.cell, { width: "12%", textAlign: "right" }]}>Paid</Text>
            <Text style={[styles.lastCell, { width: "14%", textAlign: "right" }]}>Balance</Text>
          </View>
          {statement.rows.map((row) => (
            <View style={styles.row} key={row.invoice_number}>
              <Text style={[styles.cell, { width: "16%", fontSize: 8 }]}>{row.invoice_number}</Text>
              <Text style={[styles.cell, { width: "13%" }]}>{row.invoice_date}</Text>
              <Text style={[styles.cell, { width: "33%" }]}>{row.patient || "Not listed"}</Text>
              <Text style={[styles.cell, { width: "12%", textAlign: "right" }]}>{money(row.total)}</Text>
              <Text style={[styles.cell, { width: "12%", textAlign: "right" }]}>{money(row.paid)}</Text>
              <Text style={[styles.lastCell, { width: "14%", textAlign: "right" }]}>{money(row.balance)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.grandTotal}>Total balance due</Text>
            <Text style={styles.grandTotal}>{money(statement.total_balance)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
