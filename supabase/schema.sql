create extension if not exists "pgcrypto";

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company_name text,
  address text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  default_price numeric(12, 2) not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  invoice_date date not null,
  due_date date,
  subtotal numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  patient_name text,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0
);

alter table public.invoice_items
  add column if not exists patient_name text;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(12, 2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx on public.customers(user_id);
create index if not exists services_user_id_idx on public.services(user_id);
create index if not exists invoices_user_customer_date_idx on public.invoices(user_id, customer_id, invoice_date);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id);
create index if not exists payments_invoice_id_idx on public.payments(invoice_id);

alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

create policy "Users can manage their customers"
  on public.customers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their services"
  on public.services for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their invoices"
  on public.invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage items for their invoices"
  on public.invoice_items for all
  using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

create policy "Users can manage their payments"
  on public.payments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
