/**
 * Browser-side Supabase client
 * ---------------------------
 * Use this in Client Components ("use client").
 * It talks to Supabase using the public anon key and manages the session in the browser.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(
    url,
    anonKey
  );
}
