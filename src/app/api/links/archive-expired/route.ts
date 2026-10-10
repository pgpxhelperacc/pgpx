import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  // Can be called by worker
  const links = db.getLinks(); // internally executes auto-archiving of past expires_at
  const archived = links.filter((l) => l.status === "archived");

  return NextResponse.json({
    success: true,
    archived_count: archived.length,
    timestamp: new Date().toISOString(),
  });
}
