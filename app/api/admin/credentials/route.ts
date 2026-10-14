import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminCredentials, updateAdminCredentials } from "@/lib/admin-credentials";

export const runtime = "nodejs";

// GET current admin credentials info (safe public view - no passwords)
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const credentials = await getAdminCredentials();
    return NextResponse.json({
      success: true,
      primaryEmail: credentials.primaryEmail,
      currentPassword: credentials.password,
      emails: credentials.emails,
      updatedAt: credentials.updatedAt || null,
      source: credentials.source || "env",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized." },
      { status: 401 }
    );
  }
}

// POST to change admin email and/or password
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { currentPassword, newEmail, newPassword, confirmPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current admin password is required to authorize changes." },
        { status: 400 }
      );
    }

    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: "New password and confirmation do not match." },
          { status: 400 }
        );
      }
    }

    if (newEmail) {
      const cleanEmail = String(newEmail).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json(
          { error: "Please provide a valid admin email address." },
          { status: 400 }
        );
      }
    }

    if (!newEmail && !newPassword) {
      return NextResponse.json(
        { error: "Please specify a new email or a new password to update." },
        { status: 400 }
      );
    }

    const result = await updateAdminCredentials({
      currentPassword: String(currentPassword),
      newEmail: newEmail ? String(newEmail).trim() : undefined,
      newPassword: newPassword ? String(newPassword).trim() : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update admin credentials." },
        { status: 400 }
      );
    }

    const updated = await getAdminCredentials();

    return NextResponse.json({
      success: true,
      message: "Admin credentials successfully updated.",
      primaryEmail: updated.primaryEmail,
      currentPassword: updated.password,
      emails: updated.emails,
      updatedAt: updated.updatedAt,
      source: result.source || updated.source,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 500 }
    );
  }
}
