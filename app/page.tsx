import {
  ArrowRight, CalendarCheck2, Check, Clock3, MapPin, MessageCircleMore,
  BellRing, LogIn, ShieldCheck, Sparkles, Target, UserRound, UserRoundSearch, UsersRound, Zap,
} from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";
import { ActiveMatchesPreview } from "@/components/active-matches-preview";
import { NearbyMap } from "@/components/nearby-map";
import { BrandLogo } from "@/components/brand-logo";
import { getAuthUser, loginPath } from "@/lib/auth";
import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const steps = [
  {
    number: "01",
    label: "TU PERFIL",
    icon: UserRoundSearch,
    title: "Decí cómo jugás",
    text: "Categoría, posición y ciudad. Lo justo para que un partido tenga contexto antes de que te anotes.",
    facts: ["6ta", "Revés", "Olavarría"],
    state: "Perfil listo",
  },
  {
    number: "02",
    label: "MATCHING",
    icon: UsersRound,
    title: "Ves qué partido encaja",
    text: "Horario, club, nivel y lugares disponibles en una sola vista. Sin preguntar todo por WhatsApp.",
    facts: ["Hoy 20:30", "10 km", "1 lugar"],
    state: "Partido encontrado",
  },
  {
    number: "03",
    label: "CONFIRMACIÓN",
    icon: CalendarCheck2,
    title: "Te sumás y completás la cancha",
    text: "Reservás tu lugar y el encuentro queda actualizado para todos. Cuando son cuatro, hay partido.",
    facts: ["Club definido", "6ta", "Confirmado"],
    state: "Somos 4",
  },
];

export default async function Home() {
  const [user, player, stats] = await Promise.all([getAuthUser(), getCurrentPlayer(), getCommunityStats()]);
  const accountHref = user ? "/partidos" : loginPath("/partidos");
  return (
    <main>
      <header className="site-header">
        <BrandLogo href="#inicio" />
        <nav aria-label="Navegación principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#partidos-activos">Partidos activos</a>
          <a className="nav-login" href={accountHref} target="_top">{user ? <UserRound aria-hidden="true" /> : <LogIn aria-hidden="true" />}{user ? "Mi perfil" : "Iniciar sesión"}</a>
          <a className="nav-cta" href="#registro">Crear perfil <ArrowRight aria-hidden="true" /></a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <video className="hero-video" autoPlay muted loop playsInline poster="/hero-padel.webp" aria-hidden="true">
          <source src="/hero-padel-video.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="court-line court-line-one" /><div className="court-line court-line-two" />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="launch-pill"><span /> Comunidad de pádel · Olavarría</p>
            <h1>Una cancha.<br />Cuatro jugadores.<br />Que no falte nadie.</h1>
            <p className="hero-lead">Falta Uno conecta personas que quieren jugar con partidos que todavía tienen un lugar libre. Sin perseguir mensajes, sin listas eternas y sabiendo de antemano nivel, zona y horario.</p>
            <div className="hero-actions">
              <a className="primary-cta" href="#partidos-activos">Encontrar un partido <ArrowRight aria-hidden="true" /></a>
              <a className="text-link" href={accountHref}><span className="play-dot"><Zap aria-hidden="true" /></span> Tengo un lugar libre</a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                {[1, 2, 3].map((avatar) => <span className="photo-avatar" key={avatar}><img src={`/player-avatar-${avatar}.webp`} alt="" width="39" height="39" /></span>)}
                <span className="more-avatar">+</span>
              </div>
              <div><strong>{stats.players > 0 ? `${stats.players} jugadores ya están adentro` : "La primera comunidad se está formando"}</strong><small>Gratis · Tu teléfono nunca se publica</small></div>
            </div>
          </div>
          <div className="hero-form-wrap"><ActiveMatchesPreview signedIn={Boolean(user)} canCreate={Boolean(player)} /></div>
        </div>
      </section>

      <section className="pain-strip" aria-label="Beneficios principales">
        <div><Clock3 aria-hidden="true" /><span><strong>Publicar lleva un minuto</strong><small>Horario, club, categoría y lugares</small></span></div>
        <div><Target aria-hidden="true" /><span><strong>Sabés con quién jugás</strong><small>Nivel y contexto antes de anotarte</small></span></div>
        <div><BellRing aria-hidden="true" /><span><strong>Menos grupos, más cancha</strong><small>{stats.matches > 0 ? `${stats.matches} partidos creados por la comunidad` : "La comunidad empieza en Olavarría"}</small></span></div>
      </section>

      <NearbyMap signedIn={Boolean(user)} />

      <section className="registration-section">
        <div className="registration-copy">
          <p className="eyebrow green">Tu ficha de jugador</p>
          <h2>Una vez registrado,<br />ya sabés dónde mirar.</h2>
          <p>Cargá lo justo para que otro jugador entienda si sos compatible: categoría, posición, ciudad y disponibilidad. El resto queda protegido.</p>
          <ul><li><Check /> Perfil gratuito y simple</li><li><Check /> Teléfono privado</li><li><Check /> Partidos filtrados por nivel y zona</li></ul>
        </div>
        <div className="registration-section-form"><RegistrationForm signedIn={Boolean(user)} /></div>
      </section>

      <section className="how-section flow-story" id="como-funciona">
        <div className="flow-shell">
          <div className="flow-intro">
            <p className="eyebrow">Cómo funciona</p>
            <h2>Un partido se entiende en segundos.</h2>
            <p className="flow-lead">Falta Uno ordena la información que hoy está repartida entre mensajes, grupos y llamadas. Vos ves lo importante y decidís rápido.</p>

            <div className="formation-card" aria-label="Ejemplo de partido con tres de cuatro jugadores confirmados">
              <div className="formation-card-head"><span>PARTIDO EN FORMACIÓN</span><strong>3 / 4</strong></div>
              <div className="formation-slots">
                <span className="filled"><UserRound /><small>1</small></span>
                <span className="filled"><UserRound /><small>2</small></span>
                <span className="filled"><UserRound /><small>3</small></span>
                <span className="missing"><span>+</span><small>falta uno</small></span>
              </div>
              <div className="formation-note"><span className="live-dot" /> Un lugar libre · el partido sigue visible</div>
            </div>
          </div>

          <div className="flow-board" aria-label="Recorrido para encontrar y completar un partido">
            <div className="flow-board-head">
              <div><span>RECORRIDO REAL</span><strong>De perfil a cancha</strong></div>
              <small>Ejemplo visual</small>
            </div>

            <div className="flow-rows">
              {steps.map((step) => {
                const Icon = step.icon;
                return <article className="flow-row" key={step.number}>
                  <div className="flow-number">{step.number}</div>
                  <div className="flow-icon"><Icon aria-hidden="true" /></div>
                  <div className="flow-main">
                    <span>{step.label}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                    <div className="flow-facts">{step.facts.map((fact) => <b key={fact}>{fact}</b>)}</div>
                  </div>
                  <div className="flow-state"><Check aria-hidden="true" /><span>{step.state}</span></div>
                </article>;
              })}
            </div>

            <div className="flow-board-footer">
              <div><span>RESULTADO</span><strong>Menos coordinación. Más juego.</strong></div>
              <a href={accountHref}>Ver partidos abiertos <ArrowRight aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="match-section" id="partido">
        <div className="match-copy">
          <p className="eyebrow green">La información que importa</p>
          <h2>Antes de anotarte,<br /><span>ya sabés qué partido es.</span></h2>
          <p>Cada encuentro muestra lo necesario para decidir rápido: quién organiza, cuándo se juega, dónde, qué categoría busca y cuántos lugares quedan.</p>
          <ul>
            <li><Check aria-hidden="true" /> Nivel visible antes de sumarte</li>
            <li><Check aria-hidden="true" /> Club y horario definidos</li>
            <li><Check aria-hidden="true" /> Lugares actualizados con cada inscripción</li>
          </ul>
          <a className="secondary-cta" href="#registro">Crear mi ficha de jugador <ArrowRight aria-hidden="true" /></a>
        </div>

        <div className="match-demo" aria-label="Información necesaria para armar un partido">
          <div className="demo-topbar"><div><span className="live-dot" /> Partido abierto</div><span className="demo-label">Listo para completar</span></div>
          <div className="demo-title-row">
            <div><small>Día</small><strong>Horario</strong></div>
            <div className="demo-meta"><span><MapPin aria-hidden="true" /> Club y ciudad</span><span><Target aria-hidden="true" /> Categoría</span></div>
          </div>
          <div className="player-list">
            <div className="player-row"><span className="player-avatar lime"><UsersRound /></span><span><strong>Jugadores confirmados</strong><small>Perfiles reales registrados</small></span><ShieldCheck aria-label="Perfiles verificados" /></div>
            <div className="player-row"><span className="player-avatar blue"><Target /></span><span><strong>Nivel compatible</strong><small>Categoría visible antes de anotarte</small></span><ShieldCheck aria-label="Información verificada" /></div>
            <div className="player-row"><span className="player-avatar orange"><MapPin /></span><span><strong>Lugar definido</strong><small>Sabés dónde vas antes de sumarte</small></span><ShieldCheck aria-label="Información verificada" /></div>
            <div className="player-row open-slot">
              <span className="player-avatar empty"><Sparkles aria-hidden="true" /></span>
              <span><strong>Ese lugar puede ser tuyo</strong><small>Si encaja con vos, te anotás desde acá</small></span>
              <ArrowRight aria-hidden="true" />
            </div>
          </div>
          <a href="/partidos" className="join-demo"><MessageCircleMore aria-hidden="true" /> Ver partidos reales</a>
        </div>
      </section>

      <section className="final-cta">
        <div><p className="eyebrow">El partido existe cuando aparecen los cuatro</p><h2>Entrá a la comunidad y hacé visible que querés jugar.</h2></div>
        <a className="primary-cta" href="#registro">Crear mi perfil <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="trust-strip" aria-label="Confianza y privacidad">
        <div><ShieldCheck /><span><strong>Hecho para jugar acá</strong><small>Arranca en Olavarría con una lógica pensada para la forma en que se organizan los partidos locales.</small></span></div>
        <div><BellRing /><span><strong>Contacto cuando tiene sentido</strong><small>Usamos tus datos para tu perfil y comunicaciones relacionadas con partidos.</small></span></div>
        <div><UserRound /><span><strong>Tu teléfono no es público</strong><small>Otros jugadores ven lo necesario para jugar, no tus datos personales.</small></span></div>
      </section>

      <footer>
        <BrandLogo href="#inicio" />
        <p>Jugá más. Organizá menos.</p><small>Comunidad de pádel · Olavarría</small>
      </footer>
    </main>
  );
}

async function getCommunityStats() {
  try {
    const admin = createSupabaseAdmin();
    const [{ count: players }, { count: matches }] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("matches").select("id", { count: "exact", head: true }).neq("status", "cancelled"),
    ]);
    return { players: players ?? 0, matches: matches ?? 0 };
  } catch { return { players: 0, matches: 0 }; }
}
