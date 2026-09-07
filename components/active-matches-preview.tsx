"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BellRing, Clock3, Loader2, MapPin, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PublicMatch = {
  id: number | string; title: string; matchDate: string; matchTime: string; club: string;
  location?: string | null; category: string; maxPlayers: number; confirmedCount: number; creatorFirstName: string;
  format?: "standard" | "mixed";
};

export function ActiveMatchesPreview({ signedIn = false, canCreate = false }: { signedIn?: boolean; canCreate?: boolean }) {
  const [matches, setMatches] = useState<PublicMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const refresh = () => fetch("/api/public-matches", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { matches?: PublicMatch[] }) => setMatches(result.matches ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="active-matches-panel" id="partidos-activos">
      <div className="active-panel-heading">
        <div><span className="active-pulse" /><p>Partidos abiertos</p></div>
        <div className="active-panel-actions">{canCreate ? <a href="/partidos?tab=create" target="_top">Crear partido</a> : <button type="button" onClick={() => setLoginOpen(true)}>Crear partido</button>}<a href={accountHref("/partidos", signedIn)} target="_top">Ver todos <ArrowRight /></a></div>
      </div>

      {loading && <div className="active-loading"><Loader2 className="spin" /> Buscando partidos...</div>}

      {!loading && matches.length > 0 && <div className="active-list">
        {matches.map((match) => {
          const confirmed = Number(match.confirmedCount);
          const places = Math.max(0, Number(match.maxPlayers) - confirmed);
          return <article key={match.id} className="active-match-row">
            <div className="active-date"><strong>{dayNumber(match.matchDate)}</strong><small>{monthName(match.matchDate)}</small></div>
            <div className="active-match-main">
              <div><h2>{match.title} {match.format === "mixed" && <small className="mixed-match-badge">Mixto</small>}</h2><span>Organiza {match.creatorFirstName}</span></div>
              <div className="active-meta"><span><Clock3 /> {match.matchTime}</span><span><MapPin /> {match.club}{match.location ? ` · ${match.location}` : ""}</span><span><Target /> {match.category}</span></div>
            </div>
            <div className="active-match-action">
              <span><b>{places}</b> {places === 1 ? "lugar" : "lugares"}</span>
              <a href={accountHref(`/partidos?join=${match.id}`, signedIn)} target="_top">Elegir <ArrowRight /></a>
            </div>
          </article>;
        })}
      </div>}
      {!loading && matches.length === 0 && <div className="active-empty"><span><BellRing aria-hidden="true" /></span><p className="active-empty-kicker">La próxima oportunidad puede aparecer hoy</p><h2>¿Querés jugar esta semana?</h2><p>Creá tu perfil y quedá listo para recibir partidos compatibles en Olavarría.</p><div className="empty-actions"><a href={signedIn ? "/partidos?tab=availability" : "#registro"} target={signedIn ? "_top" : undefined}>Quiero jugar <ArrowRight /></a>{canCreate ? <a className="secondary" href="/partidos?tab=create" target="_top">Publicar un lugar</a> : <button className="secondary" type="button" onClick={() => setLoginOpen(true)}>Publicar un lugar</button>}</div></div>}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="login-required-dialog">
          <DialogHeader><span className="login-dialog-icon"><Target /></span><DialogTitle>{signedIn ? "Vinculá tu perfil para crear un partido" : "Iniciá sesión para crear un partido"}</DialogTitle><DialogDescription>{signedIn ? "Antes de organizar un encuentro, necesitás vincular tu cuenta con tu perfil de jugador. Sin un perfil vinculado no se puede publicar ningún partido." : "Solo los jugadores que iniciaron sesión y vincularon su perfil pueden crear partidos. Así identificamos al organizador y protegemos a la comunidad."}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setLoginOpen(false)}>Ahora no</Button><Button asChild><a href={accountHref("/partidos", signedIn)} target="_top">{signedIn ? "Vincular mi perfil" : "Iniciar sesión"} <ArrowRight /></a></Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function accountHref(returnTo: string, signedIn: boolean) {
  return signedIn ? returnTo : `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

function dayNumber(date: string) { return new Date(`${date}T12:00:00`).getDate(); }
function monthName(date: string) { return new Intl.DateTimeFormat("es-AR", { month: "short" }).format(new Date(`${date}T12:00:00`)).replace(".", ""); }
