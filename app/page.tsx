import {
  ArrowRight, CalendarCheck2, Check, Clock3, MapPin, MessageCircleMore,
  LogIn, ShieldCheck, Sparkles, Target, UserRound, UserRoundSearch, UsersRound, Zap,
} from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";
import { ActiveMatchesPreview } from "@/components/active-matches-preview";
import { BrandLogo } from "@/components/brand-logo";
import { getAuthUser, loginPath } from "@/lib/auth";
import { getCurrentPlayer } from "@/lib/current-player";

export const dynamic = "force-dynamic";

const steps = [
  { number: "01", label: "Tu punto de partida", icon: UserRoundSearch, title: "Creá tu perfil", text: "Contanos tu categoría y cómo contactarte. Te lleva menos de un minuto." },
  { number: "02", label: "Encontrá compatibilidad", icon: UsersRound, title: "Encontrá tu equipo", text: "Descubrí jugadores compatibles con tu nivel y disponibilidad." },
  { number: "03", label: "Todo listo para jugar", icon: CalendarCheck2, title: "Armá el partido", text: "Completá los cuatro lugares, coordiná el horario y entrá a la cancha." },
];

export default async function Home() {
  const [user, player] = await Promise.all([getAuthUser(), getCurrentPlayer()]);
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
            <h1>Que nunca más<br />te falte <em>uno.</em></h1>
            <p className="hero-lead">Encontrá jugadores de tu nivel, completá el equipo y armá tu próximo partido sin depender de diez grupos de WhatsApp.</p>
            <div className="hero-actions">
              <a className="primary-cta" href="#partidos-activos">Elegir un partido <ArrowRight aria-hidden="true" /></a>
              <a className="text-link" href="#como-funciona"><span className="play-dot"><Zap aria-hidden="true" /></span> Mirá cómo funciona</a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                {[1, 2, 3].map((avatar) => <span className="photo-avatar" key={avatar}><img src={`/player-avatar-${avatar}.webp`} alt="" width="39" height="39" /></span>)}
                <span className="more-avatar">+</span>
              </div>
              <div><strong>Sumate desde el comienzo</strong><small>Registro gratuito para los primeros jugadores</small></div>
            </div>
          </div>
          <div className="hero-form-wrap"><ActiveMatchesPreview signedIn={Boolean(user)} canCreate={Boolean(player)} /></div>
        </div>
      </section>

      <section className="pain-strip" aria-label="Beneficios principales">
        <div><Clock3 aria-hidden="true" /><span><strong>Menos organización</strong><small>Dejá atrás los mensajes eternos</small></span></div>
        <div><Target aria-hidden="true" /><span><strong>Mejor nivel</strong><small>Jugá con personas compatibles</small></span></div>
        <div><UsersRound aria-hidden="true" /><span><strong>Más comunidad</strong><small>Conocé nuevos compañeros</small></span></div>
      </section>

      <section className="registration-section">
        <div className="registration-copy">
          <p className="eyebrow green">Tu perfil de jugador</p>
          <h2>Registrate una vez.<br />Jugá todas las que quieras.</h2>
          <p>Cargá tus datos para anotarte en partidos abiertos, recibir invitaciones privadas y administrar tus próximos encuentros.</p>
          <ul><li><Check /> Registro gratuito</li><li><Check /> Teléfono protegido</li><li><Check /> Categoría visible para encontrar partidos compatibles</li></ul>
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

      <footer>
        <BrandLogo href="#inicio" />
        <p>Jugá más. Organizá menos.</p><small>Primera etapa · Comunidad de pádel</small>
      </footer>
    </main>
  );
}
