import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { matchFitsPreference } from "@/lib/location-matching";
import type { CurrentPlayer } from "@/lib/current-player";

export async function loadMatches(viewer: CurrentPlayer | null, publicOnly = false) {
  const admin = createSupabaseAdmin();
  let query = admin.from("matches").select("*").neq("status", "cancelled").order("match_date").order("match_time").limit(publicOnly ? 30 : 100);
  if (publicOnly) query = query.eq("visibility", "open").eq("status", "open");
  const { data: matches, error } = await query;
  if (error) throw error;
  const matchIds = (matches ?? []).map((match) => match.id);
  const creatorIds = [...new Set((matches ?? []).map((match) => match.creator_id))];
  const [{ data: participants }, { data: creators }] = await Promise.all([
    matchIds.length ? admin.from("match_participants").select("match_id,player_id,participant_status,team").in("match_id", matchIds) : Promise.resolve({ data: [] }),
    creatorIds.length ? admin.from("profiles").select("id,first_name,last_name,gender").in("id", creatorIds) : Promise.resolve({ data: [] }),
  ]);
  const participantIds = [...new Set((participants ?? []).map((item) => item.player_id))];
  const { data: participantProfiles } = participantIds.length
    ? await admin.from("profiles").select("id,gender").in("id", participantIds)
    : { data: [] as Array<{ id: string; gender: string }> };

  return (matches ?? []).map((match) => {
    const rows = (participants ?? []).filter((item) => item.match_id === match.id);
    const confirmed = rows.filter((item) => item.participant_status === "confirmed");
    const creator = (creators ?? []).find((item) => item.id === match.creator_id);
    const teamGenderCount = (team: number, gender: string) => confirmed.filter((item) => item.team === team && participantProfiles?.find((profile) => profile.id === item.player_id)?.gender === gender).length;
    return {
      id: match.id, title: match.title, visibility: match.visibility, matchDate: match.match_date,
      matchTime: String(match.match_time).slice(0, 5), club: match.club, location: match.location,
      latitude: match.latitude, longitude: match.longitude, category: match.category, format: match.match_format,
      maxPlayers: match.max_players, status: match.status, creatorPlayerId: match.creator_id,
      creatorFirstName: creator?.first_name ?? "Jugador", creatorLastName: creator?.last_name ?? "",
      confirmedCount: confirmed.length,
      viewerStatus: viewer ? rows.find((item) => item.player_id === viewer.id)?.participant_status ?? null : null,
      teamOneDamas: teamGenderCount(1, "femenino"), teamOneCaballeros: teamGenderCount(1, "masculino"),
      teamTwoDamas: teamGenderCount(2, "femenino"), teamTwoCaballeros: teamGenderCount(2, "masculino"),
    };
  }).filter((match) => {
    if (!viewer) return publicOnly;
    const related = match.creatorPlayerId === viewer.id || Boolean(match.viewerStatus);
    if (!publicOnly && match.visibility !== "open" && !related) return false;
    if (related) return true;
    return matchFitsPreference(viewer, match);
  }).filter((match) => !publicOnly || match.confirmedCount < match.maxPlayers).slice(0, publicOnly ? 6 : 100);
}
