import { z } from "zod";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(2).max(100),
});

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return Response.json({ error: "Ubicación o distancia inválida." }, { status: 400 });

  const { lat, lon, radius } = parsed.data;
  const meters = radius * 1000;
  const query = `[out:json][timeout:15];(
    nwr(around:${meters},${lat},${lon})["sport"="padel"];
    nwr(around:${meters},${lat},${lon})["leisure"="sports_centre"]["name"~"p[aá]del",i];
  );out center tags;`;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ data: query }),
    });
    if (!response.ok) throw new Error("court-provider-unavailable");
    const data = await response.json() as { elements?: OverpassElement[] };
    const seen = new Set<string>();
    const courts = (data.elements ?? []).flatMap((item) => {
      const name = item.tags?.name?.trim();
      const courtLat = item.lat ?? item.center?.lat;
      const courtLon = item.lon ?? item.center?.lon;
      if (!name || courtLat == null || courtLon == null) return [];
      const key = name.toLocaleLowerCase("es");
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ id: String(item.id), name, distanceKm: distanceKm(lat, lon, courtLat, courtLon) }];
    }).sort((a, b) => a.distanceKm - b.distanceKm);
    return Response.json({ courts });
  } catch {
    return Response.json({ error: "No pudimos consultar las canchas cercanas. Podés escribir el club manualmente." }, { status: 503 });
  }
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
