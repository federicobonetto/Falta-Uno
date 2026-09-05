"use client";

import { useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OLAVARRIA_COURTS } from "@/lib/courts";

export function NearbyCourtSelect({ latitude, longitude, radiusKm, name = "club", required = true, defaultValue = "" }: {
  latitude: number | null; longitude: number | null; radiusKm: number; name?: string; required?: boolean; defaultValue?: string;
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [manual, setManual] = useState(false);
  const court = useMemo(() => OLAVARRIA_COURTS.find((item) => item.name === selected), [selected]);
  const mapUrl = court ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${court.name}, ${court.address ?? ""}, Olavarría, Buenos Aires`)}` : "";

  // Se conservan los parámetros para mantener compatibilidad con formularios
  // ya publicados, aunque el listado ya no depende de la geolocalización.
  void latitude; void longitude; void radiusKm;

  return <div className="nearby-court-field">
    {!manual ? <>
      <Select value={selected} onValueChange={(value) => setSelected(value ?? "")}>
        <SelectTrigger><SelectValue placeholder="Elegí un complejo de Olavarría" /></SelectTrigger>
        <SelectContent>{OLAVARRIA_COURTS.map((item) => <SelectItem key={item.id} value={item.name}>{item.name}{item.address ? ` · ${item.address}` : ""}</SelectItem>)}</SelectContent>
      </Select>
      <input type="hidden" name={name} value={selected} required={required} />
      {court && <div className="court-selection-info"><small><MapPin /> {court.address ?? "Olavarría"}</small><a href={mapUrl} target="_blank" rel="noreferrer">Ver en Google Maps <ExternalLink /></a></div>}
      <button type="button" className="manual-court-toggle" onClick={() => { setManual(true); setSelected(""); }}>¿No aparece? Escribir otro complejo</button>
    </> : <>
      <Input name={name} defaultValue={defaultValue} placeholder="Escribí el nombre del complejo" minLength={2} required={required} />
      <button type="button" className="manual-court-toggle" onClick={() => setManual(false)}>Volver al listado de complejos</button>
    </>}
  </div>;
}
