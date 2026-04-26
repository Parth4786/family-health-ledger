import { createClient } from "@supabase/supabase-js";

const fallbackUrl = "https://nufhfyyjkhshmkbmwwxh.supabase.co";
const fallbackAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZmhmeXlqa2hzaG1rYm13d3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODIxNDQsImV4cCI6MjA5Mjc1ODE0NH0.jzHn4-GgMPvQSakEVmBqMq5ZuqaKak8JOnrUgwN_cyU";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
