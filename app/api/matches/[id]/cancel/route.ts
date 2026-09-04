import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const player = await getCurrentPlayer();
  if (!player) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const id = Number((await context.params).id); const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("matches").update({ status: "cancelled" }).eq("id", id).eq("creator_id", player.id).neq("status", "cancelled").select("id").maybeSingle();
  return error || !data ? Response.json({ error: "No podés cancelar este partido." }, { status: 403 }) : Response.json({ success: true });
}
