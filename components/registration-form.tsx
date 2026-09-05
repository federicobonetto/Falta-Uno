"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, CheckCircle2, Loader2, LockKeyhole, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PADEL_CATEGORIES, genderLabel, positionLabel } from "@/lib/padel";

export function RegistrationForm({ signedIn = false }: { signedIn?: boolean }) {
  const [category, setCategory] = useState("");
  const [playingPosition, setPlayingPosition] = useState<"drive" | "reves">("drive");
  const [gender, setGender] = useState<"dama" | "caballero">("caballero");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [pendingJoinId, setPendingJoinId] = useState<number | null>(null);

  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("join"));
    if (Number.isInteger(id) && id > 0) setPendingJoinId(id);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!category) {
      setStatus("error");
      setMessage("Elegí tu categoría para continuar.");
      return;
    }

    setStatus("loading");
    setMessage("");
    const payload = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      phone: String(data.get("phone") ?? ""),
      category,
      playingPosition,
      gender,
      location: String(data.get("location") ?? ""),
      latitude: null,
      longitude: null,
      searchMode: "radius",
      searchRadiusKm: 20,
      preferredPlace: null,
      avatarDataUrl,
    };

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; player?: { firstName: string } };
      if (!response.ok) throw new Error(result.error);
      setPlayerName(result.player?.firstName ?? payload.firstName);
      setStatus("success");
      form.reset();
      setCategory("");
      setPlayingPosition("drive");
      setGender("caballero");
      setAvatarDataUrl(null);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error && error.message ? error.message : "No pudimos registrarte.");
    }
  }

  if (status === "success") {
    return (
      <div className="form-success" role="status">
        <span className="success-icon"><CheckCircle2 aria-hidden="true" /></span>
        <p className="eyebrow green">Perfil creado</p>
        <h2>¡Bienvenido, {playerName}!</h2>
        <p>Te enviamos un correo de confirmación. Abrilo y confirmá tu cuenta antes de iniciar sesión.</p>
        <Button className="success-button" asChild><a href="/login" target="_top">Ir a iniciar sesión</a></Button>
        <button className="register-another" type="button" onClick={() => setStatus("idle")}>Registrar otro jugador</button>
      </div>
    );
  }

  return (
    <form className="registration-card" onSubmit={handleSubmit} id="registro">
      <div className="form-heading">
        <span className="form-icon"><UserPlus aria-hidden="true" /></span>
        <div><p className="eyebrow green">Primeros jugadores</p><h2>Creá tu perfil gratis</h2></div>
      </div>
      <p className="form-intro">Completá tus datos y empezá a formar parte de la comunidad.</p>
      <label className="avatar-upload">
        <span className="avatar-preview">{avatarDataUrl ? <img src={avatarDataUrl} alt="Vista previa de tu foto" /> : <Camera aria-hidden="true" />}</span>
        <span><strong>Foto de perfil</strong><small>Subí una foto clara de tu rostro (opcional).</small></span>
        <Input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) { setAvatarDataUrl(null); return; }
          try { setAvatarDataUrl(await prepareAvatar(file)); setStatus("idle"); setMessage(""); }
          catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "No pudimos procesar la foto."); event.target.value = ""; }
        }} />
      </label>
      <div className="form-grid">
        <label><span>Nombre</span><Input name="firstName" autoComplete="given-name" placeholder="Tu nombre" minLength={2} required /></label>
        <label><span>Apellido</span><Input name="lastName" autoComplete="family-name" placeholder="Tu apellido" minLength={2} required /></label>
      </div>
      <label><span>Correo electrónico</span><Input name="email" type="email" autoComplete="email" placeholder="tu@email.com" required /></label>
      <label><span>Contraseña</span><Input name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength={8} required /></label>
      <label>
        <span>Categoría</span>
        <Select value={category} onValueChange={(value) => setCategory(value ?? "")}>
          <SelectTrigger className="category-select" aria-label="Elegí tu categoría"><SelectValue placeholder="Elegí tu nivel de juego" /></SelectTrigger>
          <SelectContent>{PADEL_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
      </label>
      <div className="player-detail-grid">
        <fieldset><legend>Género</legend><RadioGroup value={gender} onValueChange={(value) => setGender(value as "dama" | "caballero")} className="compact-radio">{(["caballero", "dama"] as const).map((item) => <label key={item} className={gender === item ? "selected" : ""}><RadioGroupItem value={item} /> {genderLabel(item)}</label>)}</RadioGroup></fieldset>
        <fieldset><legend>Juego</legend><RadioGroup value={playingPosition} onValueChange={(value) => setPlayingPosition(value as "drive" | "reves")} className="compact-radio">{(["reves", "drive"] as const).map((position) => <label key={position} className={playingPosition === position ? "selected" : ""}><RadioGroupItem value={position} /> {positionLabel(position)}</label>)}</RadioGroup></fieldset>
      </div>
      <label><span>Teléfono</span><Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ej. 2284 123456" minLength={8} required /></label>
      <label><span>Ciudad</span><Input name="location" autoComplete="address-level2" placeholder="Ej. Olavarría" minLength={2} required /></label>
      {status === "error" && <p className="form-error" role="alert">{message}</p>}
      <Button className="register-submit" type="submit" disabled={status === "loading"}>
        {status === "loading" ? <Loader2 className="spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
        {status === "loading" ? "Creando perfil..." : "Registrarse"}
      </Button>
      <p className="privacy-note"><LockKeyhole aria-hidden="true" /> Tu teléfono no se va a compartir. Te vamos a mandar un mensaje para recordarte el partido.</p>
      <a className="existing-profile-link" href={accountHref("/partidos", signedIn)} target="_top">¿Ya te registraste? Iniciá sesión con tu perfil</a>
    </form>
  );
}

async function prepareAvatar(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) throw new Error("La foto no puede superar los 8 MB.");
  const source = await createImageBitmap(file);
  const side = Math.min(source.width, source.height);
  const canvas = document.createElement("canvas");
  canvas.width = 320; canvas.height = 320;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No pudimos procesar la foto.");
  context.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, 320, 320);
  source.close();
  return canvas.toDataURL("image/jpeg", .78);
}

function accountHref(returnTo: string, signedIn: boolean) {
  return signedIn ? returnTo : `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
