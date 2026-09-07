import { getCurrentPlayer } from "@/lib/current-player";
import { loadMatches } from "@/lib/matches-data";

export async function GET(request: Request) {
  const requested = Number(new URL(request.url).searchParams.get("limit") ?? 6);
  const limit = Number.isFinite(requested) ? Math.min(50, Math.max(1, Math.trunc(requested))) : 6;
  try { return Response.json({ matches: await loadMatches(await getCurrentPlayer(), true, limit) }); }
  catch { return Response.json({ matches: [] }); }
}
