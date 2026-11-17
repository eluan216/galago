/**
 * Server-side Supabase client
 * --------------------------
 * Use this inside Server Components, Route Handlers, and Server Actions.
 * It reads/writes auth cookies so the session stays in sync on the server.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Next.js may throw if we try to set cookies from a pure Server Component.
        // Route Handlers / Server Actions can set them; we swallow the error otherwise.
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that cannot set cookies — safe to ignore
          }
        },
      },
    }
  );
}
