"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="rounded-md px-3 py-2 text-sm hover:bg-neutral-100" onClick={logout}>
      Log out
    </button>
  );
}
