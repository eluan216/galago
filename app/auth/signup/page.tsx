"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
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
      },
    });
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-bush border border-bush rounded-2xl p-8">
            <div className="text-4xl mb-4">✓</div>
            <h1 className="text-xl font-semibold mb-2">Check your email</h1>
            <p className="text-mist text-sm">
              We sent a confirmation link to <strong className="text-moon">{email}</strong>.
              Click it to activate your Galago account.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block mt-6 text-gold hover:underline text-sm"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
          <p className="mt-3 text-mist text-sm">Create your account</p>
        </div>

        <div className="bg-bush border border-bush rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-mist mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon placeholder:text-mist/50 focus:outline-none focus:border-gold/60 transition"
                placeholder="Your name"
              />
            </div>

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
                minLength={6}
                className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon placeholder:text-mist/50 focus:outline-none focus:border-gold/60 transition"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-night font-semibold py-3 rounded-xl hover:bg-gold-glow transition disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
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
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}