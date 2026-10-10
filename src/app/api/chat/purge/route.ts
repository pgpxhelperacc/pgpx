import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "pgpx_worker_cron_secret_auth_token_9999";

    // Validate cron secret if provided in prod
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }

    const purgedCount = db.purgeExpiredChatMessages();

    return NextResponse.json({
      success: true,
      purged_count: purgedCount,
      timestamp: new Date().toISOString(),
      policy: "Hard-delete messages older than 24h",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
