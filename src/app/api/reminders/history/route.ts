import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reminderId = searchParams.get("reminderId");

  if (!reminderId) {
    return NextResponse.json({ error: "reminderId is required" }, { status: 400 });
  }

  const history = db.getReminderHistory(reminderId);
  return NextResponse.json({ history });
}
