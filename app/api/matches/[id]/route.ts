import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const player = await getCurrentPlayer();
  if (!player) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Partido inválido." }, { status: 400 });
  const admin = createSupabaseAdmin();
  const { data: match } = await admin.from("matches").select("creator_id").eq("id", id).maybeSingle();
  if (!match) return Response.json({ error: "El partido ya no existe." }, { status: 404 });
  if (match.creator_id !== player.id) return Response.json({ error: "Sólo quien creó el partido puede eliminarlo." }, { status: 403 });
  const { error } = await admin.from("matches").delete().eq("id", id).eq("creator_id", player.id);
  return error ? Response.json({ error: "No pudimos eliminar el partido." }, { status: 500 }) : Response.json({ deleted: true });
}
