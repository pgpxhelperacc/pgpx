import { createClient } from "@supabase/supabase-js";
import { ChatMessage, ChatReplyTo } from "@/types";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pnhkqngpeovomfzsjmrw.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuaGtxbmdwZW92b21menNqbXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTY5MTU1MSwiZXhwIjoyMTA3MjY3NTUxfQ.xth6uC-9Y66O-bgS8gijiQFj4xkXrLSA34kET-RmKUM";

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function fetchSupabaseChatMessages(myPseudonym?: string): Promise<ChatMessage[]> {
  try {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabaseServer
      .from("pgpx_chat_messages")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Supabase fetch chat error:", error.message);
      return [];
    }

    if (!Array.isArray(data)) return [];

    return data.map((row) => {
      const rawReactions = (row.reactions && typeof row.reactions === "object" ? row.reactions : {}) as Record<string, any>;
      const counts: Record<string, number> = {};
      const userReactions: string[] = [];

      for (const [emoji, users] of Object.entries(rawReactions)) {
        if (Array.isArray(users)) {
          counts[emoji] = users.length;
          if (myPseudonym && users.includes(myPseudonym)) {
            userReactions.push(emoji);
          }
        } else if (typeof users === "number") {
          counts[emoji] = users;
        }
      }

      return {
        id: row.id,
        room_id: row.room_id || "batch-lounge",
        pseudonym: row.pseudonym,
        body: row.body,
        session_token: row.session_token || undefined,
        created_at: row.created_at,
        reactions: counts,
        user_reactions: userReactions,
        reply_to: (row.reply_to as ChatReplyTo) || null,
        is_own: myPseudonym ? row.pseudonym === myPseudonym : false,
      };
    });
  } catch (err) {
    console.warn("Supabase fetch chat exception:", err);
    return [];
  }
}

export async function saveSupabaseChatMessage(msg: ChatMessage): Promise<boolean> {
  try {
    const { error } = await supabaseServer.from("pgpx_chat_messages").upsert(
      {
        id: msg.id,
        room_id: msg.room_id || "batch-lounge",
        pseudonym: msg.pseudonym,
        body: msg.body,
        session_token: (msg as any).session_token || null,
        created_at: msg.created_at,
        reactions: msg.reactions || {},
        reply_to: msg.reply_to || null,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Supabase save chat error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase save chat exception:", err);
    return false;
  }
}

export async function toggleSupabaseReaction(
  messageId: string,
  emoji: string,
  userPseudonym: string
): Promise<ChatMessage | null> {
  try {
    const { data: row, error } = await supabaseServer
      .from("pgpx_chat_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (error || !row) return null;

    const raw = (row.reactions && typeof row.reactions === "object" ? { ...row.reactions } : {}) as Record<string, string[]>;
    const list: string[] = Array.isArray(raw[emoji]) ? [...raw[emoji]] : [];
    const idx = list.indexOf(userPseudonym);

    if (idx >= 0) {
      list.splice(idx, 1);
      if (list.length === 0) {
        delete raw[emoji];
      } else {
        raw[emoji] = list;
      }
    } else {
      list.push(userPseudonym);
      raw[emoji] = list;
    }

    const { data: updated, error: updateErr } = await supabaseServer
      .from("pgpx_chat_messages")
      .update({ reactions: raw })
      .eq("id", messageId)
      .select()
      .single();

    if (updateErr || !updated) return null;

    const counts: Record<string, number> = {};
    const userReactions: string[] = [];
    for (const [k, v] of Object.entries(raw)) {
      counts[k] = Array.isArray(v) ? v.length : 1;
      if (Array.isArray(v) && v.includes(userPseudonym)) {
        userReactions.push(k);
      }
    }

    return {
      id: updated.id,
      room_id: updated.room_id || "batch-lounge",
      pseudonym: updated.pseudonym,
      body: updated.body,
      created_at: updated.created_at,
      reply_to: (updated.reply_to as ChatReplyTo) || null,
      reactions: counts,
      user_reactions: userReactions,
    };
  } catch (err) {
    console.warn("Supabase toggle reaction failed:", err);
    return null;
  }
}

export async function purgeOldSupabaseChatMessages(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { error } = await supabaseServer
      .from("pgpx_chat_messages")
      .delete()
      .lt("created_at", cutoff);

    if (error) {
      console.warn("Supabase purge error:", error.message);
      return 0;
    }
    return 1;
  } catch (err) {
    return 0;
  }
}
