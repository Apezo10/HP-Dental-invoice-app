import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { requireUser } from "@/components/AuthGate";

export default async function DashboardPage() {
  await requireUser();

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600">Choose what you want to do.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/create-invoice"
            className="flex min-h-40 items-center justify-center rounded-lg border border-line bg-white p-8 text-center text-xl font-semibold hover:border-ink"
          >
            Create Invoice
          </Link>
          <Link
            href="/generate-statement"
            className="flex min-h-40 items-center justify-center rounded-lg border border-line bg-white p-8 text-center text-xl font-semibold hover:border-ink"
          >
            Generate Statement
          </Link>
        </div>
      </main>
    </>
  );
}
