import {
  ArrowRight, CalendarCheck2, Check, Clock3, MapPin, MessageCircleMore,
  BellRing, LogIn, ShieldCheck, Sparkles, Target, UserRound, UserRoundSearch, UsersRound, Zap,
} from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";
import { ActiveMatchesPreview } from "@/components/active-matches-preview";
import { BrandLogo } from "@/components/brand-logo";
import { getAuthUser, loginPath } from "@/lib/auth";
import { getCurrentPlayer } from "@/lib/current-player";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const steps = [
  { number: "01", label: "Tu punto de partida", icon: UserRoundSearch, title: "Creá tu perfil", text: "Contanos tu categoría y cómo contactarte. Te lleva menos de un minuto." },
  { number: "02", label: "Encontrá compatibilidad", icon: UsersRound, title: "Encontrá tu equipo", text: "Descubrí jugadores compatibles con tu nivel y disponibilidad." },
  { number: "03", label: "Todo listo para jugar", icon: CalendarCheck2, title: "Armá el partido", text: "Completá los cuatro lugares, coordiná el horario y entrá a la cancha." },
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
          <a className="nav-cta" href="#registro">Registrarme <ArrowRight aria-hidden="true" /></a>
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
            <p className="launch-pill"><span /> Comunidad de pádel en Olavarría</p>
            <h1>Encontrá el jugador<br />que te falta.</h1>
            <p className="hero-lead">Publicá un lugar libre o sumate a un partido cerca tuyo, con jugadores de nivel compatible y sin perseguir respuestas por WhatsApp.</p>
            <div className="hero-actions">
              <a className="primary-cta" href="#partidos-activos">Ver partidos cerca mío <ArrowRight aria-hidden="true" /></a>
              <a className="text-link" href={accountHref}><span className="play-dot"><Zap aria-hidden="true" /></span> Publicar un lugar libre</a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                {[1, 2, 3].map((avatar) => <span className="photo-avatar" key={avatar}><img src={`/player-avatar-${avatar}.webp`} alt="" width="39" height="39" /></span>)}
                <span className="more-avatar">+</span>
              </div>
              <div><strong>{stats.players > 0 ? `${stats.players} jugadores ya se registraron` : "Sumate desde el comienzo"}</strong><small>Gratis · Tu teléfono nunca se publica</small></div>
            </div>
          </div>
          <div className="hero-form-wrap"><ActiveMatchesPreview signedIn={Boolean(user)} canCreate={Boolean(player)} /></div>
        </div>
      </section>

      <section className="pain-strip" aria-label="Beneficios principales">
        <div><Clock3 aria-hidden="true" /><span><strong>Publicá en 1 minuto</strong><small>Horario, club, nivel y lugares</small></span></div>
        <div><Target aria-hidden="true" /><span><strong>Nivel compatible</strong><small>Sin sorpresas antes de jugar</small></span></div>
        <div><BellRing aria-hidden="true" /><span><strong>Partidos que se completan</strong><small>{stats.matches > 0 ? `${stats.matches} partidos creados por la comunidad` : "La comunidad empieza en Olavarría"}</small></span></div>
      </section>

      <section className="registration-section">
        <div className="registration-copy">
          <p className="eyebrow green">Tu perfil de jugador</p>
          <h2>Decí cuándo querés jugar.<br />Nosotros acercamos el partido.</h2>
          <p>Creá tu perfil en dos pasos para anotarte en partidos, recibir invitaciones y encontrar jugadores sin depender de una lista interminable de contactos.</p>
          <ul><li><Check /> Perfil gratuito en menos de un minuto</li><li><Check /> Teléfono privado y protegido</li><li><Check /> Partidos filtrados por categoría y ciudad</li></ul>
        </div>
        <div className="registration-section-form"><RegistrationForm signedIn={Boolean(user)} /></div>
      </section>

      <section className="how-section" id="como-funciona">
        <div className="section-heading">
          <p className="eyebrow green">Simple de verdad</p>
          <h2>De “falta uno” a partido armado.</h2>
          <p>Sin llamadas, sin cadenas de mensajes y sin perder media tarde coordinando.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article className="step-card" key={step.number} tabIndex={0}>
                <span className="step-number">{step.number}</span><span className="step-icon"><Icon aria-hidden="true" /></span>
                <span className="step-kicker">{step.label}</span><h3>{step.title}</h3><p>{step.text}</p>
                {step.number !== "03" && <ArrowRight className="step-arrow" aria-hidden="true" />}
              </article>
            );
          })}
        </div>
      </section>

      <section className="match-section" id="partido">
        <div className="match-copy">
          <p className="eyebrow green">Así de fácil</p>
          <h2>Un lugar libre.<br /><span>La persona indicada.</span></h2>
          <p>Creás un partido, definís categoría, zona y horario. Falta Uno se ocupa de mostrarlo a jugadores compatibles.</p>
          <ul>
            <li><Check aria-hidden="true" /> Jugadores de categoría similar</li>
            <li><Check aria-hidden="true" /> Información clara antes de sumarte</li>
            <li><Check aria-hidden="true" /> Contacto sólo cuando hay partido</li>
          </ul>
          <a className="secondary-cta" href="#registro">Quiero ser de los primeros <ArrowRight aria-hidden="true" /></a>
        </div>

        <div className="match-demo" aria-label="Información necesaria para armar un partido">
          <div className="demo-topbar"><div><span className="live-dot" /> Partido abierto</div><span className="demo-label">DATOS CLAROS</span></div>
          <div className="demo-title-row">
            <div><small>DÍA</small><strong>Horario</strong></div>
            <div className="demo-meta"><span><MapPin aria-hidden="true" /> Club y ciudad</span><span><Target aria-hidden="true" /> Categoría</span></div>
          </div>
          <div className="player-list">
            <div className="player-row"><span className="player-avatar lime"><UsersRound /></span><span><strong>Jugadores confirmados</strong><small>Solo perfiles reales registrados</small></span><ShieldCheck aria-label="Perfiles verificados" /></div>
            <div className="player-row"><span className="player-avatar blue"><Target /></span><span><strong>Nivel compatible</strong><small>Categoría visible antes de anotarte</small></span><ShieldCheck aria-label="Información verificada" /></div>
            <div className="player-row"><span className="player-avatar orange"><MapPin /></span><span><strong>Ubicación definida</strong><small>Sabés dónde se juega antes de sumarte</small></span><ShieldCheck aria-label="Información verificada" /></div>
            <div className="player-row open-slot">
              <span className="player-avatar empty"><Sparkles aria-hidden="true" /></span>
              <span><strong>Lugares disponibles</strong><small>Se actualizan con cada inscripción real</small></span>
              <ArrowRight aria-hidden="true" />
            </div>
          </div>
          <a href="/partidos" className="join-demo"><MessageCircleMore aria-hidden="true" /> Quiero sumarme</a>
        </div>
      </section>

      <section className="final-cta">
        <div><p className="eyebrow">La comunidad empieza con vos</p><h2>Tu próximo partido está más cerca.</h2></div>
        <a className="primary-cta" href="#registro">Crear mi perfil gratis <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="trust-strip" aria-label="Confianza y privacidad">
        <div><ShieldCheck /><span><strong>Hecho en Olavarría</strong><small>Una herramienta local para que ningún turno se caiga por falta de jugadores.</small></span></div>
        <div><BellRing /><span><strong>Contacto sólo cuando importa</strong><small>Usamos tus datos para el perfil y las comunicaciones relacionadas con tus partidos.</small></span></div>
        <div><UserRound /><span><strong>Vos tenés el control</strong><small>Tu teléfono no se muestra públicamente y podés administrar tus encuentros.</small></span></div>
      </section>

      <footer>
        <BrandLogo href="#inicio" />
        <p>Jugá más. Organizá menos.</p><small>Primera etapa · Comunidad de pádel</small>
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
