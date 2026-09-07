import { z } from "zod";
import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  days: z.array(z.enum(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"])).min(1),
  timeSlot: z.enum(["manana", "tarde", "noche", "indistinto"]),
  enabled: z.boolean(),
});

export async function GET() {
  const player = await getCurrentPlayer();
  if (!player) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("player_availability").select("days,time_slot,enabled").eq("user_id", player.id).maybeSingle();
  if (error) return Response.json({ availability: null });
  return Response.json({ availability: data ? { days: data.days, timeSlot: data.time_slot, enabled: data.enabled } : null });
}

export async function PATCH(request: Request) {
  const player = await getCurrentPlayer();
  if (!player) return Response.json({ error: "Primero iniciá sesión." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Elegí al menos un día y una franja horaria." }, { status: 400 });
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("player_availability").upsert({
    user_id: player.id, days: parsed.data.days, time_slot: parsed.data.timeSlot,
    enabled: parsed.data.enabled, updated_at: new Date().toISOString(),
  });
  if (error) return Response.json({ error: "La disponibilidad todavía no está habilitada en la base de prueba." }, { status: 503 });
  return Response.json({ availability: parsed.data });
}
