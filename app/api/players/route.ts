import { z } from "zod";
import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PADEL_CATEGORIES, PLAYER_GENDERS, PLAYER_POSITIONS } from "@/lib/padel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const playerSchema = z.object({
  email: z.string().email(), password: z.string().min(8).max(72),
  firstName: z.string().trim().min(2).max(50), lastName: z.string().trim().min(2).max(50),
  category: z.enum(PADEL_CATEGORIES), playingPosition: z.enum(PLAYER_POSITIONS), gender: z.enum(PLAYER_GENDERS),
  phone: z.string().trim().min(8).max(24).regex(/^[+\d][\d\s()-]+$/),
  location: z.string().trim().min(2).max(80), latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(), searchMode: z.enum(["radius", "place"]),
  searchRadiusKm: z.number().int().min(2).max(100), preferredPlace: z.string().trim().max(100).nullable().optional(),
  avatarDataUrl: z.string().max(450000).regex(/^data:image\/jpeg;base64,/).nullable().optional(),
});

export async function POST(request: Request) {
  const parsed = playerSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Revisá los datos ingresados." }, { status: 400 });
  const data = parsed.data;
  const phone = data.phone.replace(/[^+\d]/g, "");
  const authClient = await createSupabaseServerClient();
  const { data: signUp, error: signUpError } = await authClient.auth.signUp({
    email: data.email, password: data.password,
    options: { emailRedirectTo: `${new URL(request.url).origin}/auth/callback` },
  });
  if (signUpError || !signUp.user) {
    const duplicate = /already|registered|exists/i.test(signUpError?.message ?? "");
    return Response.json({ error: duplicate ? "Ese correo ya está registrado." : "No pudimos crear la cuenta." }, { status: duplicate ? 409 : 400 });
  }

  const admin = createSupabaseAdmin();
  const userId = signUp.user.id;
  let avatarPath: string | null = null;
  try {
    if (data.avatarDataUrl) {
      avatarPath = `${userId}/avatar.jpg`;
      const bytes = Buffer.from(data.avatarDataUrl.split(",")[1], "base64");
      const { error } = await admin.storage.from("avatars").upload(avatarPath, bytes, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
    }
    const { error: profileError } = await admin.from("profiles").insert({
      id: userId, first_name: data.firstName, last_name: data.lastName, category: data.category,
      gender: data.gender === "dama" ? "femenino" : "masculino", playing_position: data.playingPosition,
      location: data.location, latitude: data.latitude ?? null, longitude: data.longitude ?? null,
      search_mode: data.searchMode, search_radius_km: data.searchRadiusKm,
      preferred_place: data.preferredPlace || null, avatar_path: avatarPath,
    });
    if (profileError) throw profileError;
    const { error: privateError } = await admin.from("profile_private").insert({ user_id: userId, phone });
    if (privateError) throw privateError;
  } catch (error) {
    await admin.auth.admin.deleteUser(userId);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: /phone|unique|duplicate/i.test(message) ? "Ese teléfono ya pertenece a otro perfil." : "No pudimos guardar el perfil." }, { status: 409 });
  }
  return Response.json({ player: { firstName: data.firstName }, confirmationRequired: !signUp.session }, { status: 201 });
}

export async function GET() {
  const viewer = await getCurrentPlayer();
  if (!viewer) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("profiles")
    .select("id,first_name,last_name,category,playing_position,gender,avatar_path")
    .neq("id", viewer.id).order("first_name").limit(100);
  if (error) return Response.json({ error: "No pudimos cargar los jugadores." }, { status: 500 });
  const players = await Promise.all((data ?? []).map(async (row) => {
    let avatarDataUrl: string | null = null;
    if (row.avatar_path) avatarDataUrl = (await admin.storage.from("avatars").createSignedUrl(row.avatar_path, 3600)).data?.signedUrl ?? null;
    return { id: row.id, firstName: row.first_name, lastName: `${row.last_name.charAt(0)}.`, category: row.category,
      playingPosition: row.playing_position, gender: row.gender === "femenino" ? "dama" : "caballero", avatarDataUrl };
  }));
  return Response.json({ players });
}
