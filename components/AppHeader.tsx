import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function AppHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-sm font-semibold">
          HP Dental
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="rounded-md px-3 py-2 hover:bg-neutral-100" href="/create-invoice">
            Invoice
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-neutral-100" href="/generate-statement">
            Statement
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
