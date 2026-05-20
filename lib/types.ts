export type Customer = {
  id: string;
  user_id?: string;
  name: string;
  company_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at?: string;
};

export type Service = {
  id: string;
  user_id?: string;
  name: string;
  default_price: number;
  description: string | null;
  created_at?: string;
};

export type InvoiceStatus = "paid" | "unpaid";

export type Invoice = {
  id: string;
  user_id?: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  total: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at?: string;
};

export type InvoiceItem = {
  id?: string;
  invoice_id?: string;
  service_id: string | null;
  description: string;
  patient_name: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
};

export type InvoiceWithItems = Invoice & {
  invoice_items: InvoiceItem[];
  payments?: Payment[];
};

export type PrintableInvoice = {
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  notes: string;
};

export type StatementRow = {
  invoice_number: string;
  invoice_date: string;
  patient: string;
  total: number;
  paid: number;
  balance: number;
  status: InvoiceStatus;
};

export type PrintableStatement = {
  statement_number: string;
  company: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  start_date: string;
  end_date: string;
  rows: StatementRow[];
  total_balance: number;
};
