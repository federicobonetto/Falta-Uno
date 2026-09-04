import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string; message?: string }> }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);

  async function signIn(formData: FormData) {
    "use server";
    const supabase = await createSupabaseServerClient();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const target = safeReturnTo(String(formData.get("returnTo") ?? "/partidos"));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent("Correo o contraseña incorrectos.")}&returnTo=${encodeURIComponent(target)}`);
    redirect(target);
  }

  return <main className="auth-page">
    <BrandLogo href="/" />
    <form className="auth-card" action={signIn}>
      <p className="eyebrow green">Tu cuenta</p><h1>Iniciar sesión</h1>
      <p>Ingresá con el correo y la contraseña que usaste al registrarte.</p>
      <input type="hidden" name="returnTo" value={returnTo} />
      <label><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required /></label>
      <label><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
      {params.error && <p className="form-error">{params.error}</p>}
      {params.message && <p className="auth-message">{params.message}</p>}
      <button type="submit">Ingresar</button>
      <Link href="/#registro">Todavía no tengo una cuenta</Link>
    </form>
  </main>;
}

function safeReturnTo(value?: string) { return value?.startsWith("/") && !value.startsWith("//") ? value : "/partidos"; }
