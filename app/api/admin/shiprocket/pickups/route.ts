import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { pickupLocations } from "@/lib/shiprocket-server";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try { requireAdmin(request); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 401 }); }
  try { return NextResponse.json({ locations: await pickupLocations() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load pickup locations." }, { status: 400 }); }
}
