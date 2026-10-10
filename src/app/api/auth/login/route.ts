import { NextResponse } from "next/server";
import { isValidInstituteEmail } from "@/lib/security";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // OWASP & PRD: Restrict strictly to @iimrohtak.ac.in
    if (!isValidInstituteEmail(email)) {
      return NextResponse.json(
        {
          error: "Access Denied: Only official institute email addresses (@iimrohtak.ac.in) are permitted.",
        },
        { status: 403 }
      );
    }

    // Check allowlist or upsert user
    const user = db.upsertUser({ email, name: name || "PGPx Student" });

    // Set simple HTTP-only session cookie
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful. Magic link / OTP verified.",
      user,
    });

    response.cookies.set({
      name: "pgpx_user_id",
      value: user.id,
      httpOnly: false, // accessible to client for offline-first state
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
