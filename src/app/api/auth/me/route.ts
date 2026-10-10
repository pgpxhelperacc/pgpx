import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET() {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get("pgpx_user_id");

  let user = userIdCookie ? db.getUserById(userIdCookie.value) : null;

  // Fallback to initial demo user (Rahul Verma, student) if not logged in
  if (!user) {
    user = db.getUserById("u-rahul") || db.getUsers()[0];
  }

  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  // Allow switching persona in dev/preview mode (Student, CR, Admin)
  try {
    const { userId } = await request.json();
    const user = db.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const res = NextResponse.json({ success: true, user });
    res.cookies.set({
      name: "pgpx_user_id",
      value: user.id,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
