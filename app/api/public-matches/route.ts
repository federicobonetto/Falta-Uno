import { getCurrentPlayer } from "@/lib/current-player";
import { loadMatches } from "@/lib/matches-data";

export async function GET() {
  try { return Response.json({ matches: await loadMatches(await getCurrentPlayer(), true) }); }
  catch { return Response.json({ matches: [] }); }
}
