import { getAuthUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeCategory } from "@/lib/padel";

export type CurrentPlayer = {
  id: string; firstName: string; lastName: string; category: string; phone: string;
  location: string | null; latitude: number | null; longitude: number | null;
  searchMode: "radius" | "place"; searchRadiusKm: number; preferredPlace: string | null;
  playingPosition: "drive" | "reves"; gender: "dama" | "caballero"; avatarDataUrl: string | null;
};

export async function getCurrentPlayer(): Promise<CurrentPlayer | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const admin = createSupabaseAdmin();
  const [{ data: profile }, { data: privateProfile }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("profile_private").select("phone").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!profile) return null;
  let avatarDataUrl: string | null = null;
  if (profile.avatar_path) {
    const { data } = await admin.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarDataUrl = data?.signedUrl ?? null;
  }
  return {
    id: profile.id, firstName: profile.first_name, lastName: profile.last_name,
    category: normalizeCategory(profile.category), phone: privateProfile?.phone ?? "",
    location: profile.location, latitude: profile.latitude, longitude: profile.longitude,
    searchMode: profile.search_mode, searchRadiusKm: profile.search_radius_km,
    preferredPlace: profile.preferred_place, playingPosition: profile.playing_position,
    gender: profile.gender === "femenino" ? "dama" : "caballero", avatarDataUrl,
  };
}
