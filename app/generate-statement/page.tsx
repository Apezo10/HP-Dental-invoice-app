import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { StatementForm } from "@/components/StatementForm";
import { requireUser } from "@/components/AuthGate";
import type { Customer } from "@/lib/types";

export default async function GenerateStatementPage() {
  const { supabase } = await requireUser();
  const { data: customers, error } = await supabase.from("customers").select("*").order("name");

  if (error) {
    redirect("/dashboard");
  }

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <StatementForm initialCustomers={(customers || []) as Customer[]} />
      </main>
    </>
  );
}
