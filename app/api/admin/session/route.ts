import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { ADMIN_COOKIE, signAdminSession } from "@/lib/admin-session";
import { verifyAdminCredentials } from "@/lib/admin-credentials";
export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const previous = attempts.get(ip);
    const entry = previous && previous.until > Date.now() ? previous : { count: 0, until: Date.now() + 600000 };
    if (++entry.count > 10) return NextResponse.json({ error: "Too many login attempts. Try again in 10 minutes." }, { status: 429 });
    if (attempts.size > 1000) attempts.clear();
    attempts.set(ip, entry);
    const { email, password } = await request.json();

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const isValid = typeof password === "string" && password.length < 1000 && (await verifyAdminCredentials(cleanEmail, password));

    if (!cleanEmail || !isValid) {
      return NextResponse.json({ error: "Invalid admin email or password." }, { status: 401 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, signAdminSession(Date.now() + 8 * 3600000), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 });
    attempts.delete(ip);
    return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed." }, { status: 400 }); }
}
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
