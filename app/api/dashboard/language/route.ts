import { NextRequest, NextResponse } from "next/server";
import { isDashboardLocale } from "@/lib/dashboard-language";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const locale =
    body && typeof body === "object" && "locale" in body ? body.locale : null;

  if (!isDashboardLocale(locale)) {
    return NextResponse.json({ error: "Choose a supported language." }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set("galago-locale", locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/dashboard",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
