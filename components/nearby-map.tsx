"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Crosshair, Loader2, LocateFixed, MapPin, Navigation, SlidersHorizontal } from "lucide-react";

const OLAVARRIA = { lat: -36.8927, lon: -60.3225 };

type Court = { id: string; name: string; address?: string; latitude: number; longitude: number; distanceKm: number };
type Match = { id: number | string; title: string; club: string; location?: string | null; matchDate: string; matchTime: string; category: string; latitude?: number | null; longitude?: number | null; maxPlayers: number; confirmedCount: number };
type Point = { lat: number; lon: number };

declare global { interface Window { L?: any; } }

export function NearbyMap({ signedIn = false }: { signedIn?: boolean }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const courtMarkersRef = useRef<Record<string, any>>({});
  const pickingRef = useRef(false);
  const [center, setCenter] = useState<Point>(OLAVARRIA);
  const [radius, setRadius] = useState(10);
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [resultsTab, setResultsTab] = useState<"courts" | "matches">("courts");
  const [notice, setNotice] = useState("Mostrando Olavarría. Podés usar tu ubicación o marcar otro punto.");

  const loadData = useCallback(async (point: Point, distance: number) => {
    setLoading(true);
    const [courtResult, matchResult] = await Promise.allSettled([
      fetch(`/api/courts?lat=${point.lat}&lon=${point.lon}&radius=${distance}`, { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/public-matches?limit=50", { cache: "no-store" }).then((response) => response.json()),
    ]);
    setCourts(courtResult.status === "fulfilled" ? courtResult.value.courts ?? [] : []);
    setMatches(matchResult.status === "fulfilled" ? matchResult.value.matches ?? [] : []);
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(center, radius); }, [center, radius, loadData]);

  const nearbyMatches = useMemo(() => matches.flatMap((match) => {
    if (match.latitude == null || match.longitude == null) return [];
    const distanceKm = distance(center.lat, center.lon, Number(match.latitude), Number(match.longitude));
    return distanceKm <= radius ? [{ ...match, distanceKm }] : [];
  }).sort((a, b) => a.distanceKm - b.distanceKm), [matches, center, radius]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(() => {
      if (cancelled || !mapNode.current || !window.L || mapRef.current) return;
      const L = window.L;
      const map = L.map(mapNode.current, { zoomControl: true, scrollWheelZoom: false }).setView([center.lat, center.lon], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
      map.on("click", (event: { latlng: { lat: number; lng: number } }) => {
        if (!pickingRef.current) return;
        setCenter({ lat: event.latlng.lat, lon: event.latlng.lng });
        setPicking(false); pickingRef.current = false;
        setNotice("Punto elegido en el mapa. Actualizamos los resultados cercanos.");
      });
      mapRef.current = map;
    }).catch(() => setNotice("No pudimos cargar el mapa, pero podés seguir viendo los resultados cercanos."));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const L = window.L; const map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) layerRef.current.remove();
    const group = L.layerGroup().addTo(map); layerRef.current = group;
    L.circle([center.lat, center.lon], { radius: radius * 1000, color: "#9ed600", fillColor: "#b9f227", fillOpacity: .07, weight: 2 }).addTo(group);
    L.marker([center.lat, center.lon], { icon: markerIcon("◎", "user") }).addTo(group).bindPopup("Tu punto de búsqueda");
    courtMarkersRef.current = {};
    courts.forEach((court, index) => {
      const marker = L.marker([court.latitude, court.longitude], { icon: markerIcon(String(index + 1), "court") }).addTo(group).bindPopup(`<strong>${escapeText(court.name)}</strong><br>${escapeText(court.address || "Cancha de pádel")}<br><small>${court.distanceKm.toFixed(1)} km</small>`);
      courtMarkersRef.current[court.id] = marker;
    });
    nearbyMatches.forEach((match) => L.marker([Number(match.latitude), Number(match.longitude)], { icon: markerIcon("P", "match") }).addTo(group).bindPopup(`<strong>${escapeText(match.title)}</strong><br>${escapeText(match.club)} · ${escapeText(match.category)}`));
    map.setView([center.lat, center.lon], radius <= 5 ? 14 : radius <= 10 ? 13 : radius <= 25 ? 11 : 10);
  }, [center, radius, courts, nearbyMatches]);

  function useLocation() {
    if (!navigator.geolocation) { setNotice("Este dispositivo no permite compartir la ubicación."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
      setCenter({ lat: position.coords.latitude, lon: position.coords.longitude });
      setNotice("Ubicación activada. Sólo se usa para ordenar resultados cercanos."); setLocating(false);
    }, () => { setNotice("No se concedió el permiso. Podés marcar un punto directamente en el mapa."); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  }

  function togglePicking() { const next = !picking; setPicking(next); pickingRef.current = next; setNotice(next ? "Tocá el mapa donde querés buscar partidos." : "Selección manual cancelada."); }

  function focusCourt(court: Court) {
    const map = mapRef.current; const marker = courtMarkersRef.current[court.id];
    if (!map || !marker) return;
    map.setView([court.latitude, court.longitude], 16); marker.openPopup();
  }

  return <section className="nearby-map-section" id="mapa-partidos">
    <div className="map-section-heading"><div><p className="eyebrow green">Partidos y canchas cerca tuyo</p><h2>Elegí dónde querés jugar.</h2></div><p>Compartí tu ubicación sólo si querés, o marcá un punto en el mapa. Ajustá la distancia y descubrí qué hay disponible.</p></div>
    <div className="nearby-map-shell">
      <aside className="nearby-sidebar">
        <div className="location-controls">
          <button type="button" className="location-primary" onClick={useLocation} disabled={locating}>{locating ? <Loader2 className="spin" /> : <LocateFixed />} {locating ? "Buscando..." : "Usar mi ubicación"}</button>
          <button type="button" className={picking ? "location-secondary active" : "location-secondary"} onClick={togglePicking}><Crosshair /> {picking ? "Tocá el mapa" : "Marcar en el mapa"}</button>
        </div>
        <div className="range-control"><label htmlFor="nearby-radius"><span><SlidersHorizontal /> Radio de búsqueda</span><strong>{radius} km</strong></label><input id="nearby-radius" type="range" min="2" max="50" step="1" value={radius} onChange={(event) => setRadius(Number(event.target.value))} /><div><small>2 km</small><small>50 km</small></div></div>
        <p className="map-privacy"><Navigation /> {notice}</p>
        <div className="map-result-tabs" role="tablist" aria-label="Resultados del mapa">
          <button type="button" role="tab" aria-selected={resultsTab === "courts"} className={resultsTab === "courts" ? "active" : ""} onClick={() => setResultsTab("courts")}><strong>{loading ? "—" : courts.length}</strong><span>Canchas</span></button>
          <button type="button" role="tab" aria-selected={resultsTab === "matches"} className={resultsTab === "matches" ? "active" : ""} onClick={() => setResultsTab("matches")}><strong>{loading ? "—" : nearbyMatches.length}</strong><span>Partidos</span></button>
        </div>
        {resultsTab === "matches" && <div className="nearby-results compact-results" role="tabpanel" aria-live="polite">
          {loading && <div className="map-state"><Loader2 className="spin" /> Buscando cerca...</div>}
          {!loading && nearbyMatches.map((match) => <article key={match.id} className="nearby-match-card"><span className="nearby-match-pin"><MapPin /></span><div><strong>{match.title}</strong><small>{match.club} · {match.distanceKm.toFixed(1)} km</small><span>{match.matchDate} · {match.matchTime} · {match.category}</span></div><a href={signedIn ? `/partidos?join=${match.id}` : `/login?returnTo=${encodeURIComponent(`/partidos?join=${match.id}`)}`} target="_top" aria-label={`Ver ${match.title}`}><ArrowRight /></a></article>)}
          {!loading && nearbyMatches.length === 0 && <div className="map-empty"><MapPin /><strong>No hay partidos activos en este radio</strong><span>Probá ampliando la distancia o publicá un lugar libre.</span><a href={signedIn ? "/partidos?tab=create" : "/login?returnTo=%2Fpartidos%3Ftab%3Dcreate"} target="_top">Crear partido</a></div>}
        </div>}
        {resultsTab === "courts" && <div className="court-results-block compact-results" role="tabpanel" aria-live="polite">
          {loading && <div className="map-state"><Loader2 className="spin" /> Buscando canchas...</div>}
          <div className="court-map-list">
            {courts.map((court, index) => <button type="button" key={court.id} onClick={() => focusCourt(court)}>
              <b>{String(index + 1).padStart(2, "0")}</b><span><strong>{court.name}</strong><small>{court.address || "Olavarría"} · {court.distanceKm.toFixed(1)} km</small></span><Navigation />
            </button>)}
          </div>
        </div>}
      </aside>
      <div className={picking ? "nearby-map picking" : "nearby-map"} ref={mapNode} role="application" aria-label="Mapa interactivo de partidos y canchas cercanas" />
    </div>
    <div className="map-legend"><span><i className="court" /> Canchas</span><span><i className="match" /> Partidos activos</span><span><i className="user" /> Punto de búsqueda</span></div>
  </section>;
}

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-leaflet]");
  if (existing) return new Promise<void>((resolve, reject) => { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(), { once: true }); });
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css);
  return new Promise<void>((resolve, reject) => { const script = document.createElement("script"); script.dataset.leaflet = "true"; script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = () => resolve(); script.onerror = () => reject(new Error("leaflet")); document.head.appendChild(script); });
}

function markerIcon(label: string, kind: "court" | "match" | "user") { return window.L.divIcon({ className: "map-marker-host", html: `<span class="map-marker ${kind}"><b>${escapeText(label)}</b></span>`, iconSize: [34, 42], iconAnchor: [17, 38], popupAnchor: [0, -38] }); }
function distance(lat1: number, lon1: number, lat2: number, lon2: number) { const rad = (value: number) => value * Math.PI / 180; const dLat = rad(lat2 - lat1); const dLon = rad(lon2 - lon1); const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }
function escapeText(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }
