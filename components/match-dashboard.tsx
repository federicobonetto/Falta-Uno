"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, Check, ChevronDown, Clock3, Eye, EyeOff, Loader2,
  Copy, KeyRound, LocateFixed, LockKeyhole, LogOut, MapPin, Pencil, Plus, Trash2,
  ShieldCheck, Target, UserCheck, UsersRound, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { genderLabel, PADEL_CATEGORIES, positionLabel } from "@/lib/padel";
import { BrandLogo } from "@/components/brand-logo";
import { NearbyCourtSelect } from "@/components/nearby-court-select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Player = {
  id: string; firstName: string; lastName: string; category: string; phone?: string;
  location?: string | null; latitude?: number | null; longitude?: number | null;
  searchMode?: "radius" | "place"; searchRadiusKm?: number; preferredPlace?: string | null;
  playingPosition?: "drive" | "reves"; gender?: "dama" | "caballero";
  avatarDataUrl?: string | null;
};
type Match = {
  id: number; title: string; visibility: "open" | "private"; matchDate: string; matchTime: string;
  club: string; location: string | null; latitude: number | null; longitude: number | null;
  category: string; format: "standard" | "mixed"; maxPlayers: number; status: string; creatorPlayerId: string;
  creatorFirstName: string; creatorLastName: string; confirmedCount: number; viewerStatus: string | null;
  teamOneDamas: number; teamOneCaballeros: number; teamTwoDamas: number; teamTwoCaballeros: number;
};

const categories = [...PADEL_CATEGORIES];

async function readJson<T>(response: Response): Promise<T> {
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Ocurrió un error inesperado.");
  return result;
}

export function MatchDashboard() {
  const [profile, setProfile] = useState<Player | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("open");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [pendingJoinId, setPendingJoinId] = useState<number | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [privateAccessOpen, setPrivateAccessOpen] = useState(false);
  const [privateMatchId, setPrivateMatchId] = useState("");
  const autoJoinAttempted = useRef(false);

  const loadProfile = useCallback(async () => {
    try {
      const result = await readJson<{ player: Player | null }>(await fetch("/api/me", { cache: "no-store" }));
      setProfile(result.player);
    } catch { setProfile(null); }
    finally { setProfileLoading(false); }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [matchResult, playerResult] = await Promise.all([
        readJson<{ matches: Match[] }>(await fetch("/api/matches", { cache: "no-store" })),
        readJson<{ players: Player[] }>(await fetch("/api/players", { cache: "no-store" })),
      ]);
      setMatches(matchResult.matches.map((match) => ({
        ...match,
        confirmedCount: Number(match.confirmedCount),
        teamOneDamas: Number(match.teamOneDamas), teamOneCaballeros: Number(match.teamOneCaballeros),
        teamTwoDamas: Number(match.teamTwoDamas), teamTwoCaballeros: Number(match.teamTwoCaballeros),
      })));
      setPlayers(playerResult.players);
    } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos cargar los partidos."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);
  useEffect(() => { if (profile) void loadData(); }, [profile, loadData]);
  useEffect(() => {
    if (!profile) return;
    const interval = window.setInterval(() => void loadData(), 30_000);
    return () => window.clearInterval(interval);
  }, [profile, loadData]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "create") setActiveTab("create");
    const id = Number(params.get("join"));
    if (Number.isInteger(id) && id > 0) setPendingJoinId(id);
    const privateId = params.get("private");
    if (privateId && /^\d+$/.test(privateId)) { setPrivateMatchId(privateId); setPrivateAccessOpen(true); }
  }, []);
  useEffect(() => {
    if (!profile || !pendingJoinId || autoJoinAttempted.current) return;
    autoJoinAttempted.current = true;
    void (async () => {
      try {
        const result = await readJson<{ alreadyJoined?: boolean }>(await fetch(`/api/matches/${pendingJoinId}/join`, { method: "POST" }));
        toast.success(result.alreadyJoined ? "Ya estabas anotado en este partido." : "¡Listo! Tu lugar quedó confirmado.");
        setActiveTab("mine");
        await loadData();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No pudimos confirmar tu lugar.");
        setActiveTab("open");
      } finally {
        window.history.replaceState(null, "", "/partidos");
        setPendingJoinId(null);
      }
    })();
  }, [profile, pendingJoinId, loadData]);

  const openMatches = useMemo(() => matches.filter((match) =>
    match.visibility === "open" && (categoryFilter === "Todas" || match.category === categoryFilter)
  ), [matches, categoryFilter]);
  const myMatches = useMemo(() => matches.filter((match) =>
    (match.creatorPlayerId === profile?.id || (match.viewerStatus && match.viewerStatus !== "declined"))
  ), [matches, profile]);

  if (profileLoading) return <DashboardLoading />;
  if (!profile) return <ProfileClaim onLinked={setProfile} pendingJoinId={pendingJoinId} />;

  return (
    <div className="app-shell">
      <Toaster position="top-center" richColors />
      <header className="app-header">
        <BrandLogo />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="profile-chip" aria-label="Abrir menú de cuenta">
              <span>{profile.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" /> : <>{profile.firstName.charAt(0)}{profile.lastName.charAt(0)}</>}</span>
              <div><strong>{profile.firstName} {profile.lastName}</strong><small>{profile.category} · {positionLabel(profile.playingPosition ?? "drive")}</small></div>
              <ChevronDown className="profile-chevron" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="profile-menu">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setProfileDialogOpen(true)}><Pencil /> Editar mi perfil</DropdownMenuItem>
            <DropdownMenuItem asChild><a href="/logout" target="_top"><LogOut /> Cerrar sesión</a></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <ProfileEditorDialog
        profile={profile}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onSaved={async (updated) => { setProfile(updated); await loadData(); }}
      />
      <PrivateMatchAccessDialog open={privateAccessOpen} onOpenChange={(open) => { setPrivateAccessOpen(open); if (!open) window.history.replaceState(null, "", "/partidos"); }} initialMatchId={privateMatchId} onJoined={async () => { await loadData(); setActiveTab("mine"); }} />

      <section className="app-intro">
        <div><p className="eyebrow green">Centro de partidos</p><h1>¿Jugamos?</h1><p>Encontrá un partido abierto o armá el tuyo en pocos pasos.</p></div>
        <div className="intro-actions"><Button variant="outline" className="private-access-button" onClick={() => { setPrivateMatchId(""); setPrivateAccessOpen(true); }}><KeyRound /> Tengo contraseña</Button><Button className="quick-create" onClick={() => setActiveTab("create")}><Plus /> Crear partido</Button></div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="match-tabs">
        <TabsList className="match-tabs-list">
          <TabsTrigger value="open"><Eye /> Partidos abiertos</TabsTrigger>
          <TabsTrigger value="mine"><CalendarDays /> Mis partidos {myMatches.length > 0 && <b>{myMatches.length}</b>}</TabsTrigger>
          <TabsTrigger value="create"><Plus /> Crear partido</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="tab-panel">
          <div className="panel-heading">
            <div><h2>Partidos disponibles</h2><p>{preferenceLabel(profile)}</p></div>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? "Todas")}>
              <SelectTrigger className="filter-select"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Todas">Todas las categorías</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <MatchGrid loading={loading} matches={openMatches} profile={profile} onRefresh={loadData} mode="open" />
        </TabsContent>

        <TabsContent value="mine" className="tab-panel">
          <div className="panel-heading"><div><h2>Mis partidos</h2><p>Organizados por vos, confirmados o pendientes de respuesta.</p></div></div>
          <MatchGrid loading={loading} matches={myMatches} profile={profile} onRefresh={loadData} mode="mine" />
        </TabsContent>

        <TabsContent value="create" className="tab-panel">
          <CreateMatchForm profile={profile} players={players} onCreated={async () => { await loadData(); setActiveTab("mine"); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrivateMatchAccessDialog({ open, onOpenChange, initialMatchId, onJoined }: {
  open: boolean; onOpenChange: (open: boolean) => void; initialMatchId: string; onJoined: () => Promise<void>;
}) {
  const [matchId, setMatchId] = useState(initialMatchId);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (open) setMatchId(initialMatchId); }, [open, initialMatchId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const numericId = matchId.replace(/\D/g, "");
    if (!numericId) { toast.error("Ingresá el número del partido privado."); setSubmitting(false); return; }
    try {
      await readJson(await fetch(`/api/matches/${numericId}/join`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.get("password") }),
      }));
      await onJoined(); toast.success("Contraseña correcta. Ya estás anotado en el partido privado."); onOpenChange(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos ingresar al partido."); }
    finally { setSubmitting(false); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="private-access-dialog">
      <DialogHeader><DialogTitle>Ingresar a un partido privado</DialogTitle><DialogDescription>Ingresá el número del partido y la contraseña que te compartió el organizador.</DialogDescription></DialogHeader>
      <form onSubmit={submit}>
        <label><span>Número del partido</span><Input value={matchId} onChange={(event) => setMatchId(event.target.value)} inputMode="numeric" placeholder="Ej. 24" required /></label>
        <label><span>Contraseña</span><Input name="password" type="password" autoComplete="off" placeholder="Contraseña del encuentro" minLength={4} required /></label>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="spin" /> : <KeyRound />}{submitting ? "Verificando..." : "Ingresar y anotarme"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

function ProfileEditorDialog({ profile, open, onOpenChange, onSaved }: {
  profile: Player; open: boolean; onOpenChange: (open: boolean) => void;
  onSaved: (player: Player) => Promise<void>;
}) {
  const [category, setCategory] = useState(profile.category);
  const [playingPosition, setPlayingPosition] = useState<"drive" | "reves">(profile.playingPosition ?? "drive");
  const [gender, setGender] = useState<"dama" | "caballero">(profile.gender ?? "caballero");
  const [searchMode, setSearchMode] = useState<"radius" | "place">(profile.searchMode ?? "radius");
  const [searchRadiusKm, setSearchRadiusKm] = useState(String(profile.searchRadiusKm ?? 20));
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    profile.latitude != null && profile.longitude != null ? { latitude: profile.latitude, longitude: profile.longitude } : null
  );
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategory(profile.category);
    setPlayingPosition(profile.playingPosition ?? "drive");
    setGender(profile.gender ?? "caballero");
    setSearchMode(profile.searchMode ?? "radius");
    setSearchRadiusKm(String(profile.searchRadiusKm ?? 20));
    setCoordinates(profile.latitude != null && profile.longitude != null ? { latitude: profile.latitude, longitude: profile.longitude } : null);
  }, [open, profile]);

  function locate() {
    if (!navigator.geolocation) { toast.error("Tu dispositivo no permite obtener la ubicación."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setCoordinates({ latitude: coords.latitude, longitude: coords.longitude }); setLocating(false); toast.success("Ubicación actual guardada."); },
      () => { setLocating(false); toast.error("No pudimos acceder a tu ubicación."); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await readJson<{ player: Player }>(await fetch("/api/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"), lastName: data.get("lastName"), phone: data.get("phone"),
          category, playingPosition, gender, location: data.get("location"), latitude: coordinates?.latitude ?? null,
          longitude: coordinates?.longitude ?? null, searchMode, searchRadiusKm: Number(searchRadiusKm),
          preferredPlace: searchMode === "place" ? data.get("preferredPlace") : null,
        }),
      }));
      await onSaved(result.player); onOpenChange(false); toast.success("Perfil actualizado.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos actualizar tu perfil."); }
    finally { setSubmitting(false); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="profile-dialog">
      <DialogHeader><DialogTitle>Editar mi perfil</DialogTitle><DialogDescription>Actualizá tus datos y decidí qué partidos querés ver.</DialogDescription></DialogHeader>
      <form onSubmit={submit}>
        <div className="profile-form-grid">
          <label><span>Nombre</span><Input name="firstName" defaultValue={profile.firstName} minLength={2} required /></label>
          <label><span>Apellido</span><Input name="lastName" defaultValue={profile.lastName} minLength={2} required /></label>
          <label><span>Teléfono</span><Input name="phone" type="tel" defaultValue={profile.phone ?? ""} minLength={8} required /></label>
          <label><span>Categoría</span><Select value={category} onValueChange={(value) => setCategory(value ?? profile.category)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label><span>Género</span><Select value={gender} onValueChange={(value) => setGender((value ?? "caballero") as "dama" | "caballero")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="caballero">Masculino</SelectItem><SelectItem value="dama">Femenino</SelectItem></SelectContent></Select></label>
          <label><span>Juego</span><Select value={playingPosition} onValueChange={(value) => setPlayingPosition((value ?? "drive") as "drive" | "reves")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reves">Revés</SelectItem><SelectItem value="drive">Drive</SelectItem></SelectContent></Select></label>
          <label className="wide"><span>Ciudad o zona</span><Input name="location" defaultValue={profile.location ?? ""} placeholder="Ej. Olavarría" minLength={2} required /></label>
          <div className="wide location-inline"><Button type="button" variant="outline" onClick={locate} disabled={locating}>{locating ? <Loader2 className="spin" /> : coordinates ? <MapPin /> : <LocateFixed />}{locating ? "Ubicando..." : coordinates ? "Ubicación guardada" : "Usar ubicación actual"}</Button><small>Podés usar sólo la ciudad o permitir una búsqueda más precisa.</small></div>
          <label className="wide"><span>Buscar partidos</span><Select value={searchMode} onValueChange={(value) => setSearchMode((value ?? "radius") as "radius" | "place")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="radius">Dentro de una distancia</SelectItem><SelectItem value="place">En un club o lugar particular</SelectItem></SelectContent></Select></label>
          {searchMode === "radius" ? <label className="wide"><span>Distancia máxima</span><Select value={searchRadiusKm} onValueChange={(value) => setSearchRadiusKm(value ?? "20")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[5, 10, 20, 30, 50, 100].map((radius) => <SelectItem key={radius} value={String(radius)}>Hasta {radius} km</SelectItem>)}</SelectContent></Select></label> : <label className="wide"><span>Club o lugar preferido</span><Input name="preferredPlace" defaultValue={profile.preferredPlace ?? ""} placeholder="Ej. La Cancha Padel" minLength={2} required /></label>}
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="spin" /> : <Check />}{submitting ? "Guardando..." : "Guardar cambios"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

function ProfileClaim({ onLinked, pendingJoinId }: { onLinked: (player: Player) => void; pendingJoinId: number | null }) {
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await readJson<{ player: Player }>(await fetch("/api/me", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastName: data.get("lastName"), phone: data.get("phone") }),
      }));
      onLinked(result.player); toast.success("Perfil vinculado correctamente.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos vincular tu perfil."); }
    finally { setSubmitting(false); }
  }
  return (
    <div className="claim-page">
      <Toaster position="top-center" richColors />
      <BrandLogo />
      <form className="claim-card" onSubmit={submit}>
        <span className="claim-icon"><UserCheck /></span><p className="eyebrow green">Ya te registraste</p>
        <h1>{pendingJoinId ? "Confirmá tu lugar" : "Entrá a tu perfil"}</h1><p>{pendingJoinId ? "Ingresá a tu perfil y te anotaremos automáticamente en el partido elegido." : "Para encontrar el registro que ya creaste, ingresá tu apellido y teléfono."}</p>
        <label><span>Apellido</span><Input name="lastName" autoComplete="family-name" required /></label>
        <label><span>Teléfono</span><Input name="phone" type="tel" autoComplete="tel" placeholder="Ej. 2284 123456" required /></label>
        <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="spin" /> : <ShieldCheck />}{submitting ? "Buscando perfil..." : "Ingresar a Partidos"}</Button>
        <small><LockKeyhole /> Esta verificación es provisoria para probar el MVP.</small>
        <Link className="back-link" href={pendingJoinId ? `/?join=${pendingJoinId}#registro` : "/"}><ArrowLeft /> Todavía no tengo perfil</Link>
      </form>
    </div>
  );
}

function DashboardLoading() {
  return <div className="dashboard-loading"><Loader2 className="spin" /><p>Cargando tu perfil...</p></div>;
}

function MatchGrid({ loading, matches, profile, onRefresh, mode }: { loading: boolean; matches: Match[]; profile: Player; onRefresh: () => Promise<void>; mode: "open" | "mine" }) {
  if (loading) return <div className="match-loading"><Loader2 className="spin" /> Buscando partidos...</div>;
  if (matches.length === 0) return <div className="empty-matches"><span><CalendarDays /></span><h3>{mode === "open" ? "Todavía no hay partidos abiertos" : "Todavía no tenés partidos"}</h3><p>{mode === "open" ? "Podés ser el primero en publicar un horario." : "Creá uno abierto o invitá a jugadores específicos."}</p></div>;
  return <div className="matches-grid">{matches.map((match) => <MatchCard key={match.id} match={match} profile={profile} onRefresh={onRefresh} mode={mode} />)}</div>;
}

function MatchCard({ match, profile, onRefresh, mode }: { match: Match; profile: Player; onRefresh: () => Promise<void>; mode: "open" | "mine" }) {
  const [acting, setActing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const isCreator = match.creatorPlayerId === profile.id;
  const isFull = match.confirmedCount >= match.maxPlayers || match.status === "full";
  const places = Math.max(0, match.maxPlayers - match.confirmedCount);

  async function act(path: string, body?: object, success?: string) {
    setActing(true);
    try {
      await readJson(await fetch(`/api/matches/${match.id}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }));
      toast.success(success || "Listo."); await onRefresh(); return true;
    } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos completar la acción."); return false; }
    finally { setActing(false); }
  }

  async function deleteMatch() {
    setActing(true);
    try {
      await readJson(await fetch(`/api/matches/${match.id}`, { method: "DELETE" }));
      toast.success("Partido eliminado.");
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos eliminar el partido.");
    } finally { setActing(false); }
  }

  async function copyPrivateLink() {
    const link = `${window.location.origin}/partidos?private=${match.id}`;
    try { await navigator.clipboard.writeText(link); toast.success(`Enlace copiado. Compartí también la contraseña y el número #${match.id}.`); }
    catch { toast.info(`Compartí el partido #${match.id} y este enlace: ${link}`); }
  }

  return (
    <article className={`real-match-card ${match.visibility}`}>
      <div className="match-card-top">
        <div className="match-card-labels"><span className={`visibility-badge ${match.visibility}`}>{match.visibility === "open" ? <><Eye /> Abierto</> : <><EyeOff /> Privado</>}</span>{match.format === "mixed" && <span className="format-badge">Mixto</span>}</div>
        <span className={`places-badge ${isFull ? "full" : ""}`}>{isFull ? "Completo" : `${places} ${places === 1 ? "lugar" : "lugares"}`}</span>
      </div>
      <h3>{match.title}</h3><p className="organizer">Organiza {isCreator ? "vos" : `${match.creatorFirstName} ${match.creatorLastName.charAt(0)}.`}</p>
      <div className="match-details">
        <span><CalendarDays /> {formatDate(match.matchDate)}</span><span><Clock3 /> {match.matchTime} hs</span>
        <span><MapPin /> {match.club}{match.location ? ` · ${match.location}` : ""}</span><span><Target /> {match.category}</span>
        {match.visibility === "private" && <span><KeyRound /> Partido #{match.id}</span>}
      </div>
      {match.format === "mixed" ? <div className="mixed-teams" aria-label="Composición del partido mixto">
        <MixedTeam number={1} damas={match.teamOneDamas} caballeros={match.teamOneCaballeros} />
        <MixedTeam number={2} damas={match.teamTwoDamas} caballeros={match.teamTwoCaballeros} />
      </div> : <div className="spots-row" aria-label={`${match.confirmedCount} de ${match.maxPlayers} jugadores confirmados`}>
        {Array.from({ length: match.maxPlayers }).map((_, index) => <span key={index} className={index < match.confirmedCount ? "filled" : ""}>{index < match.confirmedCount ? <Check /> : index + 1}</span>)}
        <small>{match.confirmedCount}/{match.maxPlayers} confirmados</small>
      </div>}

      <div className="match-actions">
        {match.viewerStatus === "invited" && <>
          <Button disabled={acting} onClick={() => match.visibility === "private" ? setPasswordOpen(true) : void act("respond", { response: "confirmed" }, "Invitación aceptada. Ya estás adentro.")}><Check /> Aceptar</Button>
          <Button variant="outline" disabled={acting} onClick={() => void act("respond", { response: "declined" }, "Invitación rechazada.")}><X /> Rechazar</Button>
        </>}
        {match.visibility === "open" && !match.viewerStatus && !isFull && !(isCreator && mode === "mine") && <Button disabled={acting} onClick={() => void act("join", undefined, "¡Te sumaste al partido!")}>{acting ? <Loader2 className="spin" /> : <Plus />} Sumarme</Button>}
        {match.visibility === "open" && !match.viewerStatus && isFull && <Button disabled>Partido completo</Button>}
        {match.viewerStatus === "confirmed" && !isCreator && mode === "open" && <span className="confirmed-note"><UserCheck /> Ya estás anotado</span>}
        {match.viewerStatus === "confirmed" && !isCreator && mode === "mine" && <Button variant="outline" disabled={acting} onClick={() => void act("leave", undefined, "Saliste del partido.")}>Salir del partido</Button>}
        {isCreator && <>
          <span className="creator-note"><ShieldCheck /> Sos quien organiza</span>
          {match.visibility === "private" && <Button variant="outline" disabled={acting} onClick={() => void copyPrivateLink()}><Copy /> Copiar enlace</Button>}
          {mode === "mine" && match.viewerStatus === "confirmed" && <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="cancel-match">Salir del partido</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Dejar tu lugar?</AlertDialogTitle><AlertDialogDescription>El partido seguirá abierto para los demás jugadores. Si ya hay otra persona confirmada, pasará a organizarlo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Volver</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void act("leave", undefined, "Saliste del partido. El encuentro sigue abierto.")}>Sí, dejar mi lugar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>}
          {mode === "mine" && !match.viewerStatus && <Button variant="outline" disabled={acting} onClick={() => void act("join", undefined, "Volviste a sumarte al partido.")}>Volver a sumarme</Button>}
          {mode === "mine" && <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="delete-match" disabled={acting}><Trash2 /> Eliminar</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar este partido?</AlertDialogTitle><AlertDialogDescription>Se eliminará definitivamente para todos los jugadores, junto con las invitaciones e inscripciones. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Conservar partido</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void deleteMatch()}>Sí, eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>}
        </>}
      </div>
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}><DialogContent className="private-access-dialog"><DialogHeader><DialogTitle>Contraseña del partido</DialogTitle><DialogDescription>Ingresá la contraseña que te compartió el organizador para aceptar la invitación.</DialogDescription></DialogHeader><form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void act("respond", { response: "confirmed", password: data.get("password") }, "Invitación aceptada. Ya estás adentro.").then((success) => { if (success) setPasswordOpen(false); }); }}><label><span>Contraseña</span><Input name="password" type="password" minLength={4} required autoFocus /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>Cancelar</Button><Button type="submit" disabled={acting}>{acting ? <Loader2 className="spin" /> : <KeyRound />} Confirmar mi lugar</Button></DialogFooter></form></DialogContent></Dialog>
    </article>
  );
}

function MixedTeam({ number, damas, caballeros }: { number: number; damas: number; caballeros: number }) {
  return <div><strong>Equipo {number}</strong><span className={damas ? "filled" : ""}>Dama {damas ? <Check /> : "libre"}</span><span className={caballeros ? "filled" : ""}>Caballero {caballeros ? <Check /> : "libre"}</span></div>;
}

function CreateMatchForm({ profile, players, onCreated }: { profile: Player; players: Player[]; onCreated: () => Promise<void> }) {
  const [visibility, setVisibility] = useState<"open" | "private">("open");
  const [format, setFormat] = useState<"standard" | "mixed">("standard");
  const [category, setCategory] = useState(profile.category);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);

  function togglePlayer(id: string, checked: boolean) {
    if (checked && selected.length >= 3) { toast.info("Podés invitar hasta tres jugadores."); return; }
    setSelected((current) => checked ? [...current, id] : current.filter((playerId) => playerId !== id));
  }

  function locateMatch() {
    if (!navigator.geolocation) { toast.error("Tu dispositivo no permite obtener la ubicación."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setCoordinates({ latitude: coords.latitude, longitude: coords.longitude }); setLocating(false); toast.success("Ubicación del partido guardada."); },
      () => { setLocating(false); toast.error("No pudimos acceder a tu ubicación."); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (format === "mixed" && visibility === "private") {
      const chosen = players.filter((player) => selected.includes(player.id));
      const damas = [profile, ...chosen].filter((player) => player.gender === "dama").length;
      const caballeros = chosen.length + 1 - damas;
      if (damas > 2 || caballeros > 2) {
        toast.error("En un partido mixto sólo puede haber dos damas y dos caballeros.");
        return;
      }
    }
    setSubmitting(true);
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const result = await readJson<{ match: { id: number } }>(await fetch("/api/matches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.get("title"), club: data.get("club"), location: data.get("location"), latitude: coordinates?.latitude ?? null, longitude: coordinates?.longitude ?? null, matchDate: data.get("matchDate"), matchTime: data.get("matchTime"), category, visibility, format, privatePassword: visibility === "private" ? data.get("privatePassword") : undefined, invitedPlayerIds: visibility === "private" ? selected : [] }),
      }));
      toast.success(visibility === "open" ? "Partido abierto publicado." : `Partido privado #${result.match.id} creado. Compartí el enlace y la contraseña.`);
      form.reset(); setSelected([]); setVisibility("open"); setFormat("standard"); setCategory(profile.category); setCoordinates(null); await onCreated();
    } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos crear el partido."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="create-layout">
      <form className="create-match-form" onSubmit={submit}>
        <div className="panel-heading"><div><h2>Crear un partido</h2><p>Publicalo para todos o protegelo con una contraseña.</p></div></div>
        <fieldset className="visibility-choice"><legend>¿Quiénes pueden verlo?</legend>
          <RadioGroup value={visibility} onValueChange={(value) => setVisibility(value as "open" | "private")} className="visibility-radio">
            <label className={visibility === "open" ? "selected" : ""}><RadioGroupItem value="open" /><span className="choice-icon"><Eye /></span><span><strong>Partido abierto</strong><small>Cualquier jugador compatible puede anotarse.</small></span></label>
            <label className={visibility === "private" ? "selected" : ""}><RadioGroupItem value="private" /><span className="choice-icon"><EyeOff /></span><span><strong>Partido privado</strong><small>Se ingresa con invitación, enlace y contraseña.</small></span></label>
          </RadioGroup>
        </fieldset>
        <fieldset className="format-choice"><legend>Tipo de partido</legend>
          <RadioGroup value={format} onValueChange={(value) => setFormat(value as "standard" | "mixed")} className="format-radio">
            <label className={format === "standard" ? "selected" : ""}><RadioGroupItem value="standard" /><span><strong>Tradicional</strong><small>Cuatro jugadores de la misma categoría.</small></span></label>
            <label className={format === "mixed" ? "selected" : ""}><RadioGroupItem value="mixed" /><span><strong>Mixto</strong><small>Una dama y un caballero por equipo.</small></span></label>
          </RadioGroup>
        </fieldset>
        <div className="create-fields">
          <label className="wide"><span>Nombre del partido</span><Input name="title" placeholder="Ej. Partido del jueves" required /></label>
          <label><span>Fecha</span><Input name="matchDate" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
          <label><span>Hora</span><Input name="matchTime" type="time" required /></label>
          <label className="wide"><span>Ciudad o zona</span><Input name="location" defaultValue={profile.location ?? ""} placeholder="Ej. Olavarría" required /></label>
          <div className={`wide location-action ${coordinates ? "located" : ""}`}><span className="location-action-icon">{coordinates ? <MapPin /> : <LocateFixed />}</span><span><strong>{coordinates ? "Ubicación detectada" : "Encontrá canchas cercanas"}</strong><small>{coordinates ? `Buscaremos dentro de ${profile.searchRadiusKm ?? 20} km.` : "Permití el acceso para ver las canchas disponibles en tu rango."}</small></span><Button type="button" variant="outline" onClick={locateMatch} disabled={locating}>{locating ? <Loader2 className="spin" /> : coordinates ? "Actualizar" : "Usar mi ubicación"}</Button></div>
          <label className="wide"><span>Club o cancha</span><NearbyCourtSelect latitude={coordinates?.latitude ?? null} longitude={coordinates?.longitude ?? null} radiusKm={profile.searchRadiusKm ?? 20} /></label>
          <label className="wide"><span>Categoría</span><Select value={category} onValueChange={(value) => { setCategory(value ?? profile.category); setSelected([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          {visibility === "private" && <label className="wide private-password-field"><span>Contraseña del partido</span><Input name="privatePassword" type="password" autoComplete="new-password" placeholder="Creá una contraseña para compartir" minLength={4} maxLength={40} required /><small>La contraseña no se muestra públicamente. Guardala para enviársela a tus compañeros.</small></label>}
        </div>

        {visibility === "private" && <div className="invite-picker">
          <div><strong>Invitados opcionales</strong><small>{selected.length}/3 seleccionados{format === "mixed" ? " · máximo 2 damas + 2 caballeros" : ""}</small></div>
          {players.filter((player) => player.category === category).length === 0 ? <p className="no-players">Todavía no hay otros jugadores de categoría {category} para invitar.</p> : <div className="invite-list">{players.filter((player) => player.category === category).map((player) => {
            const checked = selected.includes(player.id);
            return <label key={player.id} className={checked ? "checked" : ""}><Checkbox checked={checked} onCheckedChange={(value) => togglePlayer(player.id, Boolean(value))} /><span className="mini-avatar">{player.avatarDataUrl ? <img src={player.avatarDataUrl} alt="" /> : <>{player.firstName.charAt(0)}{player.lastName.charAt(0)}</>}</span><span><strong>{player.firstName} {player.lastName}</strong><small>{player.category} · {positionLabel(player.playingPosition ?? "drive")} · {genderLabel(player.gender ?? "caballero")}</small></span></label>;
          })}</div>}
        </div>}
        <Button className="publish-match" type="submit" disabled={submitting}>{submitting ? <Loader2 className="spin" /> : visibility === "open" ? <Eye /> : <UserCheck />}{submitting ? "Creando..." : visibility === "open" ? "Publicar partido abierto" : "Crear y enviar invitaciones"}</Button>
      </form>

      <aside className="create-help"><span><UsersRound /></span><h3>{format === "mixed" ? "Equipos realmente mixtos" : visibility === "open" ? "Abierto a la comunidad" : "Protegido con contraseña"}</h3><p>{format === "mixed" ? "El sistema reserva en cada equipo un lugar para una dama y otro para un caballero." : visibility === "open" ? "Aparecerá en Partidos abiertos. Los jugadores de la categoría indicada podrán ocupar los lugares disponibles." : "No aparecerá en el listado público. Compartí el enlace, el número y la contraseña sólo con quienes quieras jugar."}</p><ul><li><Check /> El organizador ya ocupa un lugar</li><li><Check /> Todos deben ser de categoría {category}</li><li><Check /> {format === "mixed" ? "1 dama + 1 caballero por equipo" : visibility === "private" ? "Acceso mediante contraseña" : "Se completa al llegar a 4/4"}</li></ul></aside>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
}

function preferenceLabel(profile: Player) {
  if (profile.searchMode === "place" && profile.preferredPlace) return `Mostrando partidos en ${profile.preferredPlace}.`;
  if (profile.location) return `Mostrando partidos cerca de ${profile.location}, hasta ${profile.searchRadiusKm ?? 20} km.`;
  return "Abiertos para cualquier jugador de la categoría indicada.";
}
