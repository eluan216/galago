"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GalagoWordmark, GalagoMark } from "@/components/logo";
import { GoogleButton } from "@/components/GoogleButton";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bl)]">
        <div className="w-full max-w-md text-center">
          <div className="glass-panel p-8">
            <GalagoMark className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-xl font-black uppercase tracking-tight mb-2">
              Check your email
            </h1>
            <p className="text-white/70 text-sm">
              We sent a confirmation link to{" "}
              <strong className="text-white">{email}</strong>. Click it to
              activate your Galago wallet.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block mt-6 text-[var(--li)] font-semibold hover:underline text-sm"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bl)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <GalagoWordmark />
          </Link>
          <p className="mt-3 text-white/70 text-sm">Create your wallet</p>
        </div>

        <div className="glass-panel p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--rel)]/15 border border-[var(--rel)]/40 text-[var(--rel)] text-sm">
              {error}
            </div>
          )}

          <GoogleButton onClick={handleGoogle} label="Sign up with Google" />

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-xs uppercase tracking-wide">
              or email
            </span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5 font-medium">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--li)] transition"
                placeholder="Your name"
              />
            </div>

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
                minLength={6}
                className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--li)] transition"
                placeholder="At least 6 characters"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-galago w-full">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/70">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-[var(--li)] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
