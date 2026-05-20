import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { InvoiceForm } from "@/components/InvoiceForm";
import { requireUser } from "@/components/AuthGate";
import type { Customer, Service } from "@/lib/types";

export default async function CreateInvoicePage() {
  const { supabase, user } = await requireUser();

  const [{ data: customers, error: customerError }, { data: services, error: serviceError }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("services").select("*").order("name")
  ]);

  if (customerError || serviceError) {
    redirect("/dashboard");
  }

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <InvoiceForm
          userId={user.id}
          initialCustomers={(customers || []) as Customer[]}
          initialServices={(services || []).map((service) => ({
            ...service,
            default_price: Number(service.default_price)
          })) as Service[]}
        />
      </main>
    </>
  );
}
