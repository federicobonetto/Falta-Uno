import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

const steps = [
  ["01", "Decí cómo jugás", "Tu categoría, posición y ciudad hacen que los partidos tengan contexto real."],
  ["02", "Mirá qué se está armando", "Explorás por zona, nivel y horario antes de decidir si querés sumarte."],
  ["03", "Completá la cancha", "Reservás el lugar que falta. Cuando aparecen los cuatro, hay partido."],
] as const;

export default function ConceptosPage() {
  return <main className="concepts-page">
    <header className="concepts-header">
      <BrandLogo href="/" />
      <p className="eyebrow">Exploración visual · Falta Uno</p>
      <h1>Tres caminos para que la marca deje de parecer una plantilla.</h1>
      <p>Los tres usan elementos reales del mundo del pádel. No cambian funcionalidades: son direcciones visuales para decidir qué identidad queremos llevar al resto del producto.</p>
    </header>

    <section className="concept-block">
      <div className="concept-label"><b>A</b><div><strong>Cancha en movimiento</strong><span>El proceso ocurre literalmente dentro de una cancha. Es la opción que ya puse en la home de prueba.</span></div></div>
      <div className="court-process" aria-label="Concepto cancha en movimiento">
        <span className="court-net" aria-hidden="true" />
        <svg className="court-route" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true"><path d="M120 120 C260 55 300 410 480 390 C650 370 675 110 870 115" /><circle cx="120" cy="120" r="8" /><circle cx="480" cy="390" r="8" /><circle cx="870" cy="115" r="8" /></svg>
        <span className="court-process-ball" aria-hidden="true" />
        {steps.map(([number,title,text], index) => <article className={`court-step court-step-${index+1}`} key={number}><div className="court-step-head"><span className="court-step-number">{number}</span></div><div className="court-step-copy"><span>Movimiento {index+1}</span><h3>{title}</h3><p>{text}</p></div></article>)}
      </div>
    </section>

    <section className="concept-block score-concept">
      <div className="concept-label"><b>B</b><div><strong>Marcador de club</strong><span>Más sobrio, deportivo y directo. Se siente como un tablero real de torneo o club.</span></div></div>
      <div className="scoreboard-process">
        <div className="scoreboard-head"><div><small>FALTA UNO · CÓMO FUNCIONA</small><h2>De tres jugadores a partido completo.</h2></div><strong>3→4</strong></div>
        <div className="scoreboard-steps">{steps.map(([number,title,text]) => <article className="scoreboard-step" key={number}><small>MOVIMIENTO {number}</small><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div>
    </section>

    <section className="concept-block notice-concept">
      <div className="concept-label"><b>C</b><div><strong>Cartelera del club</strong><span>Más humana, local y comunitaria. Inspirada en avisos pegados en un club, pero sin verse retro.</span></div></div>
      <div className="noticeboard-process">
        <div className="noticeboard-title"><small>ASÍ SE ARMA</small><h2>Un lugar libre no debería perderse en un grupo.</h2></div>
        {steps.map(([number,title,text], index) => <article className={`notice-note notice-note-${index+1}`} key={number}><strong>{number}</strong><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>
  </main>;
}
