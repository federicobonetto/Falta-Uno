"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Court = { id: string; name: string; distanceKm: number };

export function NearbyCourtSelect({ latitude, longitude, radiusKm, name = "club", required = true, defaultValue = "" }: {
  latitude: number | null; longitude: number | null; radiusKm: number; name?: string; required?: boolean; defaultValue?: string;
}) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selected, setSelected] = useState(defaultValue);
  const [manual, setManual] = useState(!latitude || !longitude);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (latitude == null || longitude == null) { setManual(true); setCourts([]); return; }
    const controller = new AbortController();
    setLoading(true); setNotice(""); setManual(false);
    fetch(`/api/courts?lat=${latitude}&lon=${longitude}&radius=${radiusKm}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { courts?: Court[]; error?: string };
        if (!response.ok) throw new Error(result.error);
        setCourts(result.courts ?? []);
        if (!result.courts?.length) { setManual(true); setNotice("No encontramos canchas registradas en ese rango. Escribí el club manualmente."); }
      })
      .catch((error) => { if (error instanceof DOMException && error.name === "AbortError") return; setManual(true); setNotice(error instanceof Error ? error.message : "No pudimos cargar las canchas cercanas."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [latitude, longitude, radiusKm]);

  return <div className="nearby-court-field">
    {loading ? <div className="court-loading"><Loader2 className="spin" /> Buscando canchas dentro de {radiusKm} km…</div> : !manual && courts.length > 0 ? <>
      <Select value={selected} onValueChange={(value) => setSelected(value ?? "")}>
        <SelectTrigger><SelectValue placeholder="Elegí una cancha cercana" /></SelectTrigger>
        <SelectContent>{courts.map((court) => <SelectItem key={court.id} value={court.name}>{court.name} · {court.distanceKm} km</SelectItem>)}</SelectContent>
      </Select>
      <input type="hidden" name={name} value={selected} />
      <button type="button" className="manual-court-toggle" onClick={() => { setManual(true); setSelected(""); }}>No está en la lista</button>
    </> : <Input name={name} defaultValue={defaultValue} placeholder="Escribí el nombre del club" minLength={2} required={required} />}
    {notice && <small className="court-notice"><MapPin /> {notice}</small>}
  </div>;
}
