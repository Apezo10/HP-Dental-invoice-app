"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function signUp() {
    setLoading(true);
    setMessage("");
    const { error } = await createClient().auth.signUp({ email, password });
    setMessage(error ? error.message : "Account created. Check your email if confirmation is enabled.");
    setLoading(false);
  }

  return (
    <form className="space-y-4 rounded-lg border border-line bg-white p-5" onSubmit={submit}>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="field"
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          className="field"
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {message ? <p className="text-sm text-neutral-700">{message}</p> : null}
      <button className="button-primary w-full" disabled={loading}>
        {loading ? "Working..." : "Log in"}
      </button>
      <button className="button-secondary w-full" type="button" onClick={signUp} disabled={loading || !email || !password}>
        Create account
      </button>
    </form>
  );
}
