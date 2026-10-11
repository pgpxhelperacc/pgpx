import { createClient } from "@supabase/supabase-js";
import { ChatMessage } from "@/types";

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

export async function fetchSupabaseChatMessages(): Promise<ChatMessage[]> {
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

    return data.map((row) => ({
      id: row.id,
      room_id: row.room_id || "batch-lounge",
      pseudonym: row.pseudonym,
      body: row.body,
      session_token: row.session_token || undefined,
      created_at: row.created_at,
      reactions: row.reactions || {},
    }));
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
