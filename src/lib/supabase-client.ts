import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pnhkqngpeovomfzsjmrw.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuaGtxbmdwZW92b21menNqbXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2OTE1NTEsImV4cCI6MjEwNzI2NzU1MX0.2v77zAHZ0aRAlGLVGhhhIid7w6Dm97KwB2ZpIX2kB-Q";

export const supabaseBrowser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
