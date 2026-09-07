"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const days = [
  ["lunes", "Lun"], ["martes", "Mar"], ["miercoles", "Mié"], ["jueves", "Jue"],
  ["viernes", "Vie"], ["sabado", "Sáb"], ["domingo", "Dom"],
] as const;

export function AvailabilityForm() {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState("noche");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/availability", { cache: "no-store" }).then((response) => response.json()).then((result) => {
      if (result.availability) { setSelectedDays(result.availability.days ?? []); setTimeSlot(result.availability.timeSlot ?? "noche"); }
    }).finally(() => setLoading(false));
  }, []);

  function toggle(day: string) { setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]); }

  async function save() {
    if (!selectedDays.length) { toast.error("Elegí al menos un día."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/availability", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: selectedDays, timeSlot, enabled: true }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success("Disponibilidad guardada. Te avisaremos cuando aparezca un partido compatible.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos guardar tu disponibilidad."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="availability-loading"><Loader2 className="spin" /> Cargando disponibilidad...</div>;
  return <section className="availability-layout">
    <div className="availability-card">
      <span className="availability-icon"><BellRing /></span><p className="eyebrow green">Avisos compatibles</p>
      <h2>¿Cuándo querés jugar?</h2><p>Marcá tus días habituales. Cuando se publique un partido de tu nivel y ciudad, vas a estar listo para sumarte.</p>
      <fieldset><legend>Días disponibles</legend><div className="day-picker">{days.map(([value, label]) => <button type="button" key={value} className={selectedDays.includes(value) ? "selected" : ""} onClick={() => toggle(value)}>{selectedDays.includes(value) && <Check />}{label}</button>)}</div></fieldset>
      <label><span>Horario preferido</span><Select value={timeSlot} onValueChange={(value) => setTimeSlot(value ?? "noche")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manana">Mañana</SelectItem><SelectItem value="tarde">Tarde</SelectItem><SelectItem value="noche">Noche</SelectItem><SelectItem value="indistinto">Cualquier horario</SelectItem></SelectContent></Select></label>
      <Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="spin" /> : <BellRing />}{saving ? "Guardando..." : "Avisarme de partidos"}</Button>
    </div>
    <aside className="availability-help"><strong>¿Cómo funciona?</strong><ol><li>Guardás tus días y horario.</li><li>Se publica un partido compatible.</li><li>Recibís el aviso y elegís si querés sumarte.</li></ol><small>Tu disponibilidad no muestra tu teléfono ni te obliga a participar.</small></aside>
  </section>;
}
