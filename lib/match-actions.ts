import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function markMatchFull(matchId: number) {
  const admin = createSupabaseAdmin();
  const { count } = await admin.from("match_participants").select("id", { count: "exact", head: true })
    .eq("match_id", matchId).eq("participant_status", "confirmed");
  await admin.from("matches").update({ status: (count ?? 0) >= 4 ? "full" : "open" }).eq("id", matchId).neq("status", "cancelled");
}

export function chooseTeam(rows: Array<{ team: number | null; gender: string }>, gender: string, format: string) {
  const stats = [1, 2].map((team) => ({ team, total: rows.filter((r) => r.team === team).length,
    sameGender: rows.filter((r) => r.team === team && r.gender === gender).length }));
  if (format === "mixed") {
    if (rows.filter((r) => r.gender === gender).length >= 2) return null;
    return stats.filter((s) => s.total < 2 && s.sameGender === 0).sort((a, b) => a.total - b.total || a.team - b.team)[0]?.team ?? null;
  }
  return stats.filter((s) => s.total < 2).sort((a, b) => a.total - b.total || a.team - b.team)[0]?.team ?? null;
}

export async function participantRowsWithGender(matchId: number, includeInvited: boolean) {
  const admin = createSupabaseAdmin();
  let query = admin.from("match_participants").select("player_id,team,participant_status").eq("match_id", matchId);
  query = includeInvited ? query.in("participant_status", ["confirmed", "invited"]) : query.eq("participant_status", "confirmed");
  const { data } = await query;
  const ids = (data ?? []).map((row) => row.player_id);
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id,gender").in("id", ids) : { data: [] };
  return (data ?? []).map((row) => ({ team: row.team, gender: profiles?.find((p) => p.id === row.player_id)?.gender ?? "masculino" }));
}
