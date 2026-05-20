"use client";

import { FormEvent, useMemo, useState } from "react";
import { money, statementNumber, todayIso } from "@/lib/format";
import { createClient } from "@/lib/supabase/browser";
import { PdfActions } from "@/components/pdf/PdfActions";
import type { Customer, InvoiceItem, InvoiceStatus, PrintableStatement, StatementRow } from "@/lib/types";

type InvoiceQueryRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total: number | string;
  status: InvoiceStatus;
  invoice_items: InvoiceItem[];
};

export function StatementForm({ initialCustomers }: { initialCustomers: Customer[] }) {
  const companyOptions = useMemo(() => {
    const companies = new Map<string, Customer[]>();

    initialCustomers.forEach((customer) => {
      const company = customer.company_name?.trim();
      if (!company) {
        return;
      }

      const key = company.toLowerCase();
      companies.set(key, [...(companies.get(key) || []), customer]);
    });

    return Array.from(companies.values())
      .map((customers) => ({
        name: customers[0].company_name as string,
        customers
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [initialCustomers]);
  const [companyName, setCompanyName] = useState(companyOptions[0]?.name || "");
  const [startDate, setStartDate] = useState(todayIso().slice(0, 8) + "01");
  const [endDate, setEndDate] = useState(todayIso());
  const [statement, setStatement] = useState<PrintableStatement | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedCompany = useMemo(
    () => companyOptions.find((company) => company.name === companyName) || null,
    [companyName, companyOptions]
  );

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setStatement(null);

    if (!selectedCompany) {
      setMessage("Choose a company first.");
      setLoading(false);
      return;
    }

    const customerIds = selectedCompany.customers.map((customer) => customer.id);
    const companyInfo = selectedCompany.customers.find((customer) => customer.address || customer.phone || customer.email);
    const supabase = createClient();
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, total, status, invoice_items(description, patient_name, quantity, unit_price, line_total)")
      .in("customer_id", customerIds)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate)
      .order("invoice_date", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const rowsFromInvoices = (invoices || []) as InvoiceQueryRow[];
    const invoiceIds = rowsFromInvoices.map((invoice) => invoice.id);
    const paymentsByInvoice = new Map<string, number>();

    if (invoiceIds.length) {
      const { data: payments, error: paymentError } = await supabase
        .from("payments")
        .select("invoice_id, amount")
        .in("invoice_id", invoiceIds);

      if (paymentError) {
        setMessage(paymentError.message);
        setLoading(false);
        return;
      }

      (payments || []).forEach((payment) => {
        paymentsByInvoice.set(payment.invoice_id, (paymentsByInvoice.get(payment.invoice_id) || 0) + Number(payment.amount || 0));
      });
    }

    const rows: StatementRow[] = rowsFromInvoices.map((invoice) => {
      const total = Number(invoice.total || 0);
      const paid = invoice.status === "paid" ? total : paymentsByInvoice.get(invoice.id) || 0;
      const balance = Math.max(total - paid, 0);

      return {
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        patient: invoice.invoice_items
          .map((item) => item.patient_name || "")
          .filter(Boolean)
          .join(", "),
        total,
        paid,
        balance,
        status: invoice.status
      };
    });

    setStatement({
      statement_number: statementNumber(),
      company: {
        name: selectedCompany.name,
        address: companyInfo?.address || null,
        phone: companyInfo?.phone || null,
        email: companyInfo?.email || null
      },
      start_date: startDate,
      end_date: endDate,
      rows,
      total_balance: rows.reduce((sum, row) => sum + row.balance, 0)
    });
    setMessage(rows.length ? "Statement ready." : "No invoices found for that customer and date range.");
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Generate Statement</h1>
        <p className="mt-2 text-sm text-neutral-600">Pick a company and date range. The statement includes all customers under that company.</p>
      </div>

      <form className="grid gap-4 rounded-lg border border-line bg-white p-4 md:grid-cols-4" onSubmit={generate}>
        <div className="md:col-span-2">
          <label className="label" htmlFor="statement-company">
            Company
          </label>
          <select className="field" id="statement-company" value={companyName} onChange={(event) => setCompanyName(event.target.value)}>
            <option value="">Choose company</option>
            {companyOptions.map((company) => (
              <option key={company.name} value={company.name}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="start-date">
            Start date
          </label>
          <input className="field" id="start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="end-date">
            End date
          </label>
          <input className="field" id="end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
        {selectedCompany ? (
          <div className="text-sm text-neutral-700 md:col-span-3">
            <div className="font-medium">{selectedCompany.name}</div>
            <div>{selectedCompany.customers.length} customer{selectedCompany.customers.length === 1 ? "" : "s"}</div>
          </div>
        ) : null}
        <div className="flex items-end">
          <button className="button-primary w-full" disabled={loading}>
            {loading ? "Generating..." : "Generate Statement"}
          </button>
        </div>
      </form>

      {message ? <p className="text-sm text-neutral-700">{message}</p> : null}

      {statement ? (
        <section className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <div className="border-b border-line px-3 py-2 text-sm font-medium">
              Statement #: {statement.statement_number}
            </div>
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="w-40 p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {statement.rows.map((row) => (
                  <tr className="border-b border-line" key={row.invoice_number}>
                    <td className="break-all p-3 text-xs">{row.invoice_number}</td>
                    <td className="p-3">{row.invoice_date}</td>
                    <td className="p-3">{row.patient || "Not listed"}</td>
                    <td className="p-3 text-right">{money(row.total)}</td>
                    <td className="p-3 text-right">{money(row.paid)}</td>
                    <td className="p-3 text-right">{money(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="p-3 text-right text-base font-semibold" colSpan={5}>
                    Total balance due
                  </td>
                  <td className="p-3 text-right text-base font-semibold">{money(statement.total_balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <PdfActions
            kind="statement"
            data={statement}
            fileName={`${statement.statement_number}.pdf`}
          />
        </section>
      ) : null}
    </div>
  );
}
