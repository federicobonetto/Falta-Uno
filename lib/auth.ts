import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuthUser(returnTo = "/partidos") {
  const user = await getAuthUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  return user;
}

export function loginPath(returnTo = "/partidos") {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
