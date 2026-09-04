export function BrandLogo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <a className={`brand ${compact ? "brand-compact" : ""}`} href={href} aria-label="Falta Uno, inicio">
      <img className="brand-logo-image" src="/logo-falta-uno.png" alt="" width="447" height="336" />
    </a>
  );
}
