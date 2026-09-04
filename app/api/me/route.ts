import { z } from "zod";
import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PADEL_CATEGORIES, PLAYER_GENDERS, PLAYER_POSITIONS } from "@/lib/padel";

const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(50), lastName: z.string().trim().min(2).max(50),
  phone: z.string().trim().min(8).max(24).regex(/^[+\d][\d\s()-]+$/), category: z.enum(PADEL_CATEGORIES),
  playingPosition: z.enum(PLAYER_POSITIONS), gender: z.enum(PLAYER_GENDERS), location: z.string().trim().min(2).max(80),
  latitude: z.number().min(-90).max(90).nullable().optional(), longitude: z.number().min(-180).max(180).nullable().optional(),
  searchMode: z.enum(["radius", "place"]), searchRadiusKm: z.number().int().min(2).max(100),
  preferredPlace: z.string().trim().max(100).nullable().optional(),
});

export async function GET() { return Response.json({ player: await getCurrentPlayer() }); }

export async function POST() { return Response.json({ error: "Iniciá sesión con tu correo y contraseña." }, { status: 401 }); }

export async function PATCH(request: Request) {
  const player = await getCurrentPlayer();
  if (!player) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Revisá los datos del perfil." }, { status: 400 });
  const data = parsed.data; const phone = data.phone.replace(/[^+\d]/g, ""); const admin = createSupabaseAdmin();
  const { error: profileError } = await admin.from("profiles").update({ first_name: data.firstName, last_name: data.lastName,
    category: data.category, playing_position: data.playingPosition, gender: data.gender === "dama" ? "femenino" : "masculino",
    location: data.location, latitude: data.latitude ?? null, longitude: data.longitude ?? null, search_mode: data.searchMode,
    search_radius_km: data.searchRadiusKm, preferred_place: data.preferredPlace || null }).eq("id", player.id);
  const { error: privateError } = await admin.from("profile_private").update({ phone }).eq("user_id", player.id);
  if (profileError || privateError) return Response.json({ error: /unique|duplicate/i.test(privateError?.message ?? "") ? "Ese teléfono ya pertenece a otro perfil." : "No pudimos actualizar tu perfil." }, { status: 409 });
  return Response.json({ player: { ...player, ...data, phone, preferredPlace: data.preferredPlace || null } });
}
