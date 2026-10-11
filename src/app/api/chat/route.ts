import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { containsProfanityOrSpam, generateDailyPseudonym } from "@/lib/security";
import {
  fetchSupabaseChatMessages,
  saveSupabaseChatMessage,
} from "@/lib/supabase";

function getOrSetAnonToken(): { token: string; isNew: boolean } {
  const cookieStore = cookies();
  const existing = cookieStore.get("pgpx_anon_token");
  if (existing?.value) {
    return { token: existing.value, isNew: false };
  }
  const newToken = `anon_${crypto.randomBytes(8).toString("hex")}`;
  return { token: newToken, isNew: true };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reroll = searchParams.get("reroll") === "true";

  let { token, isNew } = getOrSetAnonToken();
  if (reroll) {
    token = `anon_${crypto.randomBytes(8).toString("hex")}`;
    isNew = true;
  }

  const myPseudonym = generateDailyPseudonym(token);

  try {
    const supabaseMsgs = await fetchSupabaseChatMessages();
    if (Array.isArray(supabaseMsgs)) {
      db.replaceChatMessages(supabaseMsgs);
    }
  } catch (err) {
    // fallback gracefully to local store
  }

  const messages = db.getChatMessages(myPseudonym);

  const response = NextResponse.json({
    messages,
    currentUserPseudonym: myPseudonym,
    anonToken: token,
    policyNotice: "100% anonymous batch lounge • All messages vanish after 24 hours.",
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  if (isNew || reroll) {
    response.cookies.set("pgpx_anon_token", token, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export async function POST(request: Request) {
  try {
    const { token, isNew } = getOrSetAnonToken();
    const myPseudonym = generateDailyPseudonym(token);
    const body = await request.json();
    const { message, reroll, id: clientMsgId } = body;

    if (reroll) {
      const freshToken = `anon_${crypto.randomBytes(8).toString("hex")}`;
      const freshPseudonym = generateDailyPseudonym(freshToken);
      const res = NextResponse.json({
        success: true,
        currentUserPseudonym: freshPseudonym,
      });
      res.cookies.set("pgpx_anon_token", freshToken, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message exceeds maximum 1000 characters" }, { status: 400 });
    }

    // Safety: check profanity/spam
    if (containsProfanityOrSpam(message)) {
      return NextResponse.json(
        { error: "Message flagged for inappropriate language. Please keep discourse constructive." },
        { status: 422 }
      );
    }

    const newMessage = db.postChatMessage(message, myPseudonym, token, clientMsgId);

    try {
      await saveSupabaseChatMessage(newMessage);
    } catch (saveErr) {
      console.warn("Failed to persist to Supabase:", saveErr);
    }

    const res = NextResponse.json({ success: true, message: newMessage }, { status: 201 });

    if (isNew) {
      res.cookies.set("pgpx_anon_token", token, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
