"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="bg-bush border border-bush rounded-2xl p-8 shadow-xl">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-mist mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon placeholder:text-mist/50 focus:outline-none focus:border-gold/60 transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-mist mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon placeholder:text-mist/50 focus:outline-none focus:border-gold/60 transition"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-night font-semibold py-3 rounded-xl hover:bg-gold-glow transition disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-mist/20" />
        <span className="text-mist text-xs">or</span>
        <div className="flex-1 h-px bg-mist/20" />
      </div>

      <button
        onClick={handleGoogle}
        type="button"
        className="w-full border border-mist/30 text-moon py-3 rounded-xl hover:border-gold/40 transition flex items-center justify-center gap-2"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-mist">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-gold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-night font-bold">
              G
            </div>
            <span className="text-2xl font-semibold">galago</span>
          </Link>
          <p className="mt-3 text-mist text-sm">Sign in to your account</p>
        </div>

        <Suspense fallback={<div className="text-center text-mist">Loading…</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
