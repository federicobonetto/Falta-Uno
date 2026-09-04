import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Faltan las variables privadas de Supabase.");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
