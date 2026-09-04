import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { chooseTeam, markMatchFull, participantRowsWithGender } from "@/lib/match-actions";
import { verifyStoredPassword } from "@/lib/private-password";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const player = await getCurrentPlayer();
  if (!player) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const id = Number((await context.params).id); const admin = createSupabaseAdmin();
  const { data: match } = await admin.from("matches").select("*").eq("id", id).maybeSingle();
  if (!match || match.status !== "open") return Response.json({ error: "Este partido ya no acepta inscripciones." }, { status: 409 });
  if (match.category !== player.category) return Response.json({ error: `Este partido es para categoría ${match.category}.` }, { status: 400 });
  if (match.visibility === "private" && match.creator_id !== player.id) {
    const body = await request.json().catch(() => ({})) as { password?: string };
    if (!await verifyStoredPassword(body.password ?? "", match.private_password_hash)) return Response.json({ error: "La contraseña del partido no es correcta." }, { status: 403 });
  }
  const { data: existing } = await admin.from("match_participants").select("participant_status").eq("match_id", id).eq("player_id", player.id).maybeSingle();
  if (existing?.participant_status === "confirmed") return Response.json({ success: true, alreadyJoined: true });
  if (existing?.participant_status === "invited") {
    await admin.from("match_participants").update({ participant_status: "confirmed" }).eq("match_id", id).eq("player_id", player.id);
    await markMatchFull(id); return Response.json({ success: true });
  }
  const rows = await participantRowsWithGender(id, match.visibility === "private");
  if (rows.length >= 4) return Response.json({ error: "El partido acaba de completar sus lugares." }, { status: 409 });
  const team = chooseTeam(rows, player.gender === "dama" ? "femenino" : "masculino", match.match_format);
  if (!team) return Response.json({ error: "No queda un lugar compatible en este partido." }, { status: 409 });
  const { error } = await admin.from("match_participants").insert({ match_id: id, player_id: player.id, participant_status: "confirmed", team });
  if (error) return Response.json({ error: /unique/i.test(error.message) ? "Ya estabas anotado." : "No pudimos anotarte." }, { status: 409 });
  await markMatchFull(id); return Response.json({ success: true });
}
