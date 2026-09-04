import { z } from "zod";
import { getCurrentPlayer } from "@/lib/current-player";
import { loadMatches } from "@/lib/matches-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createStoredPassword } from "@/lib/private-password";
import { MATCH_FORMATS, PADEL_CATEGORIES } from "@/lib/padel";

const schema = z.object({
  title: z.string().trim().min(3).max(70), visibility: z.enum(["open", "private"]),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), matchTime: z.string().regex(/^\d{2}:\d{2}$/),
  club: z.string().trim().min(2).max(80), location: z.string().trim().min(2).max(80),
  latitude: z.number().min(-90).max(90).nullable().optional(), longitude: z.number().min(-180).max(180).nullable().optional(),
  category: z.enum(PADEL_CATEGORIES), format: z.enum(MATCH_FORMATS), privatePassword: z.string().trim().min(4).max(40).optional(),
  invitedPlayerIds: z.array(z.string().uuid()).max(3).default([]),
});

export async function GET() {
  const viewer = await getCurrentPlayer();
  if (!viewer) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  try { return Response.json({ matches: await loadMatches(viewer) }); }
  catch { return Response.json({ error: "No pudimos cargar los partidos." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const creator = await getCurrentPlayer();
  if (!creator) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Revisá los datos del partido." }, { status: 400 });
  const data = parsed.data;
  const start = new Date(`${data.matchDate}T${data.matchTime}:00-03:00`);
  if (!Number.isFinite(start.getTime()) || start <= new Date()) return Response.json({ error: "La fecha y hora deben ser posteriores al momento actual." }, { status: 400 });
  if (data.visibility === "private" && !data.privatePassword) return Response.json({ error: "Creá una contraseña de al menos cuatro caracteres." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: active } = await admin.from("matches").select("id").eq("creator_id", creator.id).in("status", ["open", "full"]).maybeSingle();
  if (active) return Response.json({ error: "Ya creaste un partido activo. Podrás crear otro cuando lo elimines o llegue su horario." }, { status: 409 });
  const invitedIds = [...new Set(data.invitedPlayerIds)].filter((id) => id !== creator.id);
  const { data: invited } = invitedIds.length ? await admin.from("profiles").select("id,category,gender").in("id", invitedIds) : { data: [] };
  if ((invited ?? []).length !== invitedIds.length || (invited ?? []).some((p) => p.category !== data.category)) return Response.json({ error: "Todos los invitados deben existir y tener la misma categoría." }, { status: 400 });
  const teams = assignTeams(creator.gender, (invited ?? []).map((p) => ({ id: p.id, gender: p.gender === "femenino" ? "dama" as const : "caballero" as const })), data.format);
  if (!teams) return Response.json({ error: "Los invitados seleccionados no permiten formar un partido mixto." }, { status: 400 });
  const passwordHash = data.visibility === "private" ? await createStoredPassword(data.privatePassword!) : null;
  const { data: match, error } = await admin.from("matches").insert({ creator_id: creator.id, title: data.title,
    visibility: data.visibility, match_date: data.matchDate, match_time: data.matchTime, club: data.club,
    location: data.location, latitude: data.latitude ?? null, longitude: data.longitude ?? null, category: data.category,
    match_format: data.format, private_password_hash: passwordHash, max_players: 4, status: "open" }).select("id").single();
  if (error || !match) return Response.json({ error: /one_active|unique/i.test(error?.message ?? "") ? "Ya tenés un partido activo." : "No pudimos crear el partido." }, { status: 409 });
  const participantRows = [{ match_id: match.id, player_id: creator.id, participant_status: "confirmed", team: 1 },
    ...invitedIds.map((id, index) => ({ match_id: match.id, player_id: id, participant_status: "invited", team: teams.get(id) ?? (index % 2 ? 1 : 2) }))];
  const { error: participantError } = await admin.from("match_participants").insert(participantRows);
  if (participantError) { await admin.from("matches").delete().eq("id", match.id); return Response.json({ error: "No pudimos agregar los participantes." }, { status: 500 }); }
  return Response.json({ match: { id: match.id } }, { status: 201 });
}

function assignTeams(creatorGender: "dama" | "caballero", invited: Array<{ id: string; gender: "dama" | "caballero" }>, format: "standard" | "mixed") {
  const result = new Map<string, number>();
  if (format === "standard") { invited.forEach((p, i) => result.set(p.id, i % 2 === 0 ? 2 : 1)); return result; }
  const slots = [{ team: 1, gender: creatorGender }];
  for (const player of invited) {
    const choice = [1, 2].map((team) => ({ team, total: slots.filter((s) => s.team === team).length,
      same: slots.some((s) => s.team === team && s.gender === player.gender) })).filter((t) => t.total < 2 && !t.same).sort((a, b) => a.total - b.total)[0];
    if (!choice) return null; result.set(player.id, choice.team); slots.push({ team: choice.team, gender: player.gender });
  }
  return result;
}
