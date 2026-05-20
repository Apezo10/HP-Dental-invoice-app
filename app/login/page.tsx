import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">HP Dental</h1>
          <p className="mt-2 text-sm text-neutral-600">Sign in to create invoices and statements.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
