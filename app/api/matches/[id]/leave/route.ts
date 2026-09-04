import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { markMatchFull } from "@/lib/match-actions";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const player = await getCurrentPlayer();
  if (!player) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const id = Number((await context.params).id); const admin = createSupabaseAdmin();
  const { data: match } = await admin.from("matches").select("creator_id").eq("id", id).maybeSingle();
  if (!match) return Response.json({ error: "Partido inexistente." }, { status: 404 });
  const { data: removed } = await admin.from("match_participants").delete().eq("match_id", id).eq("player_id", player.id).eq("participant_status", "confirmed").select("id").maybeSingle();
  if (!removed) return Response.json({ error: "No estabas confirmado en este partido." }, { status: 409 });
  let transferred = false;
  if (match.creator_id === player.id) {
    const { data: candidates } = await admin.from("match_participants").select("player_id").eq("match_id", id).eq("participant_status", "confirmed").order("id");
    const ids = (candidates ?? []).map((row) => row.player_id);
    const { data: busy } = ids.length ? await admin.from("matches").select("creator_id").in("creator_id", ids).in("status", ["open", "full"]) : { data: [] };
    const replacement = ids.find((candidate) => !(busy ?? []).some((row) => row.creator_id === candidate));
    if (replacement) { await admin.from("matches").update({ creator_id: replacement }).eq("id", id); transferred = true; }
    else { await admin.from("matches").delete().eq("id", id); return Response.json({ success: true, matchDeleted: true }); }
  }
  await markMatchFull(id);
  return Response.json({ success: true, organizerTransferred: transferred });
}
