/**
 * Galago Middleware
 * -----------------
 * Runs on every matched request before the page/API handler.
 * Responsibilities:
 *  1. Keep the Supabase auth session in sync with cookies
 *  2. Protect /dashboard/* routes (redirect unauthenticated users to sign-in)
 *  3. Redirect already-logged-in users away from /auth/signin and /auth/signup
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Start with a pass-through response; we may mutate cookies on it
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client that can read/write cookies on the request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          // Write cookies onto the request (for downstream handlers)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response so we can attach the same cookies to the client
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh / read the current user (this also refreshes the session if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Route protection ---

  // Unauthenticated users trying to open the dashboard → send to sign-in
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("next", request.nextUrl.pathname); // return here after login
    return NextResponse.redirect(url);
  }

  // Authenticated users on auth pages → send to dashboard
  if (
    (request.nextUrl.pathname.startsWith("/auth/signin") ||
      request.nextUrl.pathname.startsWith("/auth/signup")) &&
    user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Only run middleware on these paths (keeps it fast)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/signin",
    "/auth/signup",
  ],
};
