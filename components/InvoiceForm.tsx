"use client";

import { FormEvent, useMemo, useState } from "react";
import { invoiceNumber, money, todayIso } from "@/lib/format";
import { createClient } from "@/lib/supabase/browser";
import { PdfActions } from "@/components/pdf/PdfActions";
import type { Customer, InvoiceItem, InvoiceStatus, PrintableInvoice, Service } from "@/lib/types";

type DraftLine = {
  service_id: string;
  description: string;
  patient_name: string;
  quantity: number;
  unit_price: number;
};

const blankLine = (): DraftLine => ({
  service_id: "",
  description: "",
  patient_name: "",
  quantity: 1,
  unit_price: 0
});

export function InvoiceForm({
  userId,
  initialCustomers,
  initialServices
}: {
  userId: string;
  initialCustomers: Customer[];
  initialServices: Service[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [services, setServices] = useState(initialServices);
  const [customerId, setCustomerId] = useState(initialCustomers[0]?.id || "");
  const [status, setStatus] = useState<InvoiceStatus>("unpaid");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", company_name: "", address: "", phone: "", email: "" });
  const [newService, setNewService] = useState({ name: "", default_price: "" });
  const [printable, setPrintable] = useState<PrintableInvoice | null>(null);

  const selectedCustomer = customers.find((customer) => customer.id === customerId) || null;
  const companySuggestions = useMemo(() => {
    const typed = newCustomer.company_name.trim().toLowerCase();
    const seen = new Set<string>();

    return customers
      .filter((customer) => {
        const company = customer.company_name?.trim();
        if (!company) {
          return false;
        }

        const key = company.toLowerCase();
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return typed.length >= 2 ? key.startsWith(typed) || key.includes(typed) : true;
      })
      .map((customer) => customer.company_name as string)
      .slice(0, 6);
  }, [customers, newCustomer.company_name]);
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0), 0),
    [lines]
  );

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  function selectService(index: number, serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    updateLine(index, {
      service_id: serviceId,
      description: service?.name || "",
      unit_price: service ? Number(service.default_price) : 0
    });
  }

  function updateCustomerCompany(companyName: string) {
    const matchingCustomer = customers.find(
      (customer) => customer.company_name?.trim().toLowerCase() === companyName.trim().toLowerCase()
    );

    setNewCustomer((current) => ({
      ...current,
      company_name: companyName,
      address: matchingCustomer?.address || current.address,
      phone: matchingCustomer?.phone || current.phone,
      email: matchingCustomer?.email || current.email
    }));
  }

  async function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await createClient()
      .from("customers")
      .insert({ ...newCustomer, user_id: userId })
      .select("*")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setCustomers((current) => [...current, data as Customer].sort((a, b) => a.name.localeCompare(b.name)));
    setCustomerId(data.id);
    setNewCustomer({ name: "", company_name: "", address: "", phone: "", email: "" });
    setShowCustomerForm(false);
  }

  async function removeSelectedCustomer() {
    if (!selectedCustomer) {
      setMessage("Choose a customer to remove.");
      return;
    }

    const confirmed = window.confirm(`Remove ${selectedCustomer.name}? Customers with saved invoices cannot be removed.`);
    if (!confirmed) {
      return;
    }

    const { error } = await createClient().from("customers").delete().eq("id", selectedCustomer.id);

    if (error) {
      setMessage("This customer could not be removed. If they have saved invoices, keep them so old invoices and statements stay correct.");
      return;
    }

    setCustomers((current) => current.filter((customer) => customer.id !== selectedCustomer.id));
    setCustomerId("");
    setPrintable(null);
    setMessage(`Removed ${selectedCustomer.name}.`);
  }

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      user_id: userId,
      name: newService.name,
      default_price: Number(newService.default_price || 0),
      description: null
    };
    const { data, error } = await createClient().from("services").insert(payload).select("*").single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setServices((current) =>
      [...current, { ...(data as Service), default_price: Number(data.default_price) }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setNewService({ name: "", default_price: "" });
    setShowServiceForm(false);
  }

  function buildPrintable(number = invoiceNumber()): PrintableInvoice | null {
    if (!selectedCustomer) {
      setMessage("Choose or add a customer first.");
      return null;
    }

    const items: InvoiceItem[] = lines
      .filter((line) => line.service_id && line.description.trim())
      .map((line) => ({
        service_id: line.service_id || null,
        description: line.description,
        patient_name: line.patient_name.trim() || null,
        quantity: Number(line.quantity || 0),
        unit_price: Number(line.unit_price || 0),
        line_total: Number(line.quantity || 0) * Number(line.unit_price || 0)
      }));

    if (!items.length) {
      setMessage("Add at least one service line.");
      return null;
    }

    return {
      invoice_number: number,
      invoice_date: todayIso(),
      due_date: null,
      status,
      customer: selectedCustomer,
      items,
      subtotal,
      total: subtotal,
      notes
    };
  }

  function preview() {
    const draft = buildPrintable();
    if (draft) {
      setPrintable(draft);
      setMessage("Preview ready. Save the invoice when it looks correct.");
    }
  }

  async function saveInvoice() {
    setSaving(true);
    setMessage("");
    const number = printable?.invoice_number || invoiceNumber();
    const draft = buildPrintable(number);

    if (!draft || !selectedCustomer) {
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        invoice_number: draft.invoice_number,
        customer_id: selectedCustomer.id,
        invoice_date: draft.invoice_date,
        due_date: null,
        subtotal: draft.subtotal,
        total: draft.total,
        status,
        notes
      })
      .select("*")
      .single();

    if (invoiceError) {
      setMessage(invoiceError.message);
      setSaving(false);
      return;
    }

    const { error: itemError } = await supabase.from("invoice_items").insert(
      draft.items.map((item) => ({
        invoice_id: invoice.id,
        service_id: item.service_id,
        description: item.description,
        patient_name: item.patient_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }))
    );

    if (itemError) {
      setMessage(itemError.message);
      setSaving(false);
      return;
    }

    setPrintable(draft);
    setMessage(`Saved invoice ${draft.invoice_number}.`);
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
        <p className="mt-2 text-sm text-neutral-600">Choose saved details, adjust this invoice, then save and print.</p>
      </div>

      <section className="grid gap-4 rounded-lg border border-line bg-white p-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="label" htmlFor="customer">
            Customer
          </label>
          <select className="field" id="customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Choose customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.company_name ? `- ${customer.company_name}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <div className="grid w-full grid-cols-2 gap-2">
            <button className="button-secondary" type="button" onClick={() => setShowCustomerForm((value) => !value)}>
              Add
            </button>
            <button className="button-secondary" type="button" onClick={removeSelectedCustomer} disabled={!selectedCustomer}>
              Remove
            </button>
          </div>
        </div>
        {selectedCustomer ? (
          <div className="text-sm text-neutral-700 md:col-span-3">
            <div className="font-medium">{selectedCustomer.company_name || selectedCustomer.name}</div>
            <div>{selectedCustomer.address}</div>
            <div>
              {[selectedCustomer.phone, selectedCustomer.email].filter(Boolean).join(" | ")}
            </div>
          </div>
        ) : null}
      </section>

      {showCustomerForm ? (
        <form className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-2" onSubmit={addCustomer}>
          <input className="field" placeholder="Customer name" value={newCustomer.name} onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })} required />
          <div>
            <input
              className="field"
              list="company-suggestions"
              placeholder="Dental office / company"
              value={newCustomer.company_name}
              onChange={(event) => updateCustomerCompany(event.target.value)}
            />
            <datalist id="company-suggestions">
              {companySuggestions.map((company) => (
                <option key={company} value={company} />
              ))}
            </datalist>
          </div>
          <input className="field md:col-span-2" placeholder="Address" value={newCustomer.address} onChange={(event) => setNewCustomer({ ...newCustomer, address: event.target.value })} />
          <input className="field" placeholder="Phone" value={newCustomer.phone} onChange={(event) => setNewCustomer({ ...newCustomer, phone: event.target.value })} />
          <input className="field" placeholder="Email" value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} />
          <button className="button-primary md:col-span-2">Save Customer</button>
        </form>
      ) : null}

      <section className="rounded-lg border border-line bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Invoice date</label>
            <div className="field bg-neutral-50 text-neutral-700">{todayIso()}</div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="field" value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus)}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Services</h2>
          <button className="button-secondary" type="button" onClick={() => setShowServiceForm((value) => !value)}>
            Add Service
          </button>
        </div>

        {showServiceForm ? (
          <form className="mb-4 grid gap-3 rounded-md border border-line p-3 md:grid-cols-2" onSubmit={addService}>
            <input className="field" placeholder="Service name" value={newService.name} onChange={(event) => setNewService({ ...newService, name: event.target.value })} required />
            <input className="field" inputMode="decimal" placeholder="Default price" value={newService.default_price} onChange={(event) => setNewService({ ...newService, default_price: event.target.value })} required />
            <button className="button-primary md:col-span-2">Save Service</button>
          </form>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="p-2">Saved service</th>
                <th className="p-2">Patient name</th>
                <th className="w-24 p-2 text-right">Qty</th>
                <th className="w-32 p-2 text-right">Unit price</th>
                <th className="w-32 p-2 text-right">Line total</th>
                <th className="w-16 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr className="border-b border-line" key={index}>
                  <td className="p-2">
                    <select className="field" value={line.service_id} onChange={(event) => selectService(index, event.target.value)}>
                      <option value="">Choose service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      className="field"
                      placeholder="Patient name"
                      value={line.patient_name}
                      onChange={(event) => updateLine(index, { patient_name: event.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input className="field text-right" inputMode="decimal" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
                  </td>
                  <td className="p-2">
                    <input className="field text-right" inputMode="decimal" value={line.unit_price} onChange={(event) => updateLine(index, { unit_price: Number(event.target.value) })} />
                  </td>
                  <td className="p-2 text-right">{money(Number(line.quantity || 0) * Number(line.unit_price || 0))}</td>
                  <td className="p-2 text-right">
                    <button className="text-sm text-neutral-500 hover:text-ink" type="button" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="button-secondary mt-3" type="button" onClick={() => setLines((current) => [...current, blankLine()])}>
          Add Line
        </button>
      </section>

      <section className="grid gap-4 rounded-lg border border-line bg-white p-4 md:grid-cols-[1fr_260px]">
        <div>
          <label className="label">Notes</label>
          <textarea className="field min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-lg">
            <span>Total due</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button className="button-secondary" type="button" onClick={preview}>
              Preview
            </button>
            <button className="button-primary" type="button" onClick={saveInvoice} disabled={saving}>
              {saving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </div>
      </section>

      {message ? <p className="text-sm text-neutral-700">{message}</p> : null}
      {printable ? <PdfActions kind="invoice" data={printable} fileName={`${printable.invoice_number}.pdf`} /> : null}
    </div>
  );
}
