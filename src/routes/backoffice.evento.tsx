import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/integrations/api/client";
import { getEventConfig, updateEventConfig, type EventConfig } from "@/integrations/api/event-config";

export const Route = createFileRoute("/backoffice/evento")({
  head: () => ({ meta: [{ title: "Sede & Fechas — Backoffice" }] }),
  component: EventoAdminPage,
});

function formatApiError(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const parts = Object.entries(err.data as Record<string, unknown>).map(
      ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : String(v)}`,
    );
    if (parts.length) return parts.join(" · ");
  }
  if (err instanceof Error) return err.message;
  return "Ocurrió un error. Intenta nuevamente.";
}

function EventoAdminPage() {
  const [form, setForm] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    getEventConfig()
      .then((data) => active && setForm(data))
      .catch(() => active && setError("No se pudo cargar la configuración."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof EventConfig>(key: K, value: EventConfig[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await updateEventConfig(form);
      setForm(updated);
      setSuccess(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <MapPin className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Sede & Fechas</h1>
          <p className="text-sm text-foreground/70">Configura la información de la sección de ubicación.</p>
        </div>
      </header>

      {success && (
        <div className="mt-6 rounded-xl border border-emerald-300/50 bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
          Cambios guardados correctamente.
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading || !form ? (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <form onSubmit={onSave} className="mt-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Label className="text-sm font-medium">Título de ubicación</Label>
            <Input className="mt-2" value={form.location_headline} onChange={(e) => set("location_headline", e.target.value)} placeholder="Trujillo, Perú" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Label className="text-sm font-medium">Descripción</Label>
            <Textarea className="mt-2" rows={3} value={form.location_description} onChange={(e) => set("location_description", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Label className="text-sm font-medium">Fechas</Label>
              <Input className="mt-2" value={form.dates} onChange={(e) => set("dates", e.target.value)} placeholder="21, 22 y 23 de octubre 2026" />
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Label className="text-sm font-medium">Sede</Label>
              <Input className="mt-2" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Costa del Sol Wyndham · Trujillo" />
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Label className="text-sm font-medium">País invitado</Label>
              <Input className="mt-2" value={form.guest_country} onChange={(e) => set("guest_country", e.target.value)} placeholder="Chile" />
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Label className="text-sm font-medium">Etiqueta edición anterior</Label>
              <Input className="mt-2" value={form.previous_edition_label} onChange={(e) => set("previous_edition_label", e.target.value)} placeholder="Edición 2025" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Label className="text-sm font-medium">Estadísticas edición anterior</Label>
            <Input className="mt-2" value={form.previous_edition_stats} onChange={(e) => set("previous_edition_stats", e.target.value)} placeholder="+200 empresas · +380 reuniones B2B" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Label className="text-sm font-medium">Consulta del mapa</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Texto de búsqueda en Google Maps (arma el mapa y el botón "Cómo llegar").
            </p>
            <Input className="mt-2" value={form.map_query} onChange={(e) => set("map_query", e.target.value)} placeholder="Costa del Sol Wyndham Trujillo" />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
