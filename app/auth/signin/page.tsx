"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GalagoWordmark } from "@/components/logo";
import { GoogleButton } from "@/components/GoogleButton";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    authError ? "Sign-in failed. Try again or use Google." : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let supabase;
    try {
      supabase = createClient();
    } catch {
      setError("Platform setup is incomplete. Contact the administrator.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
    } catch {
      setError("Platform setup is incomplete. Contact the administrator.");
    }
  }

  return (
    <div className="glass-panel p-8">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--rel)]/15 border border-[var(--rel)]/40 text-[var(--rel)] text-sm">
          {error}
        </div>
      )}

      <GoogleButton onClick={handleGoogle} label="Sign in with Google" />

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-white/20" />
        <span className="text-white/50 text-xs uppercase tracking-wide">or email</span>
        <div className="flex-1 h-px bg-white/20" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-1.5 font-medium">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--li)] transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1.5 font-medium">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--li)] transition"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-galago w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/70">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-[var(--li)] font-semibold hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bl)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <GalagoWordmark />
          </Link>
          <p className="mt-3 text-white/70 text-sm">Sign in to your wallet</p>
        </div>

        <Suspense
          fallback={
            <div className="text-center text-white/60">Loading…</div>
          }
        >
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
