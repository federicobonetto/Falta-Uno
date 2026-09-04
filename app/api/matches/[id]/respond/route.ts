import { z } from "zod";
import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { markMatchFull } from "@/lib/match-actions";
import { verifyStoredPassword } from "@/lib/private-password";
const schema = z.object({ response: z.enum(["confirmed", "declined"]), password: z.string().optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const player = await getCurrentPlayer(); if (!player) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Respuesta inválida." }, { status: 400 });
  const id = Number((await context.params).id); const admin = createSupabaseAdmin();
  const { data: match } = await admin.from("matches").select("visibility,private_password_hash").eq("id", id).maybeSingle();
  if (!match) return Response.json({ error: "El partido ya no existe." }, { status: 404 });
  if (parsed.data.response === "confirmed" && match.visibility === "private" && !await verifyStoredPassword(parsed.data.password ?? "", match.private_password_hash)) return Response.json({ error: "La contraseña no es correcta." }, { status: 403 });
  const { data } = await admin.from("match_participants").update({ participant_status: parsed.data.response }).eq("match_id", id).eq("player_id", player.id).eq("participant_status", "invited").select("id").maybeSingle();
  if (!data) return Response.json({ error: "La invitación ya fue respondida o no existe." }, { status: 409 });
  if (parsed.data.response === "confirmed") await markMatchFull(id);
  return Response.json({ success: true });
}
