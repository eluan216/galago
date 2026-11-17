/**
 * Galago Middleware
 * -----------------
 * Sync Supabase session cookies + protect /dashboard.
 * Must never throw: a thrown error becomes 500 MIDDLEWARE_INVOCATION_FAILED.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Missing env → pass through without auth (page/API can show a config error)
  if (!url || !anonKey) {
    console.error(
      "[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/signin";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (
      (request.nextUrl.pathname.startsWith("/auth/signin") ||
        request.nextUrl.pathname.startsWith("/auth/signup")) &&
      user
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  } catch (err) {
    console.error("[middleware] auth check failed:", err);
    // Fail open so the user still reaches the page
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/signin", "/auth/signup"],
};
