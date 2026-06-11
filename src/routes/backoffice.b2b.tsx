import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Handshake, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/integrations/api/client";
import {
  getB2BConfig,
  updateB2BConfig,
  listB2BAgenda,
  createB2BAgendaItem,
  updateB2BAgendaItem,
  deleteB2BAgendaItem,
  type B2BConfig,
  type B2BAgendaItem,
} from "@/integrations/api/b2b";

export const Route = createFileRoute("/backoffice/b2b")({
  head: () => ({ meta: [{ title: "Rueda B2B — Backoffice" }] }),
  component: B2BAdminPage,
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

type AgendaForm = {
  day_label: string;
  title: string;
  time_range: string;
  sort_order: string;
  is_active: boolean;
};

const emptyAgenda: AgendaForm = {
  day_label: "",
  title: "",
  time_range: "",
  sort_order: "0",
  is_active: true,
};

function B2BAdminPage() {
  // --- Config (singleton) ---
  const [cfg, setCfg] = useState<B2BConfig | null>(null);
  const [loadingCfg, setLoadingCfg] = useState(true);
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgError, setCfgError] = useState<string | null>(null);
  const [cfgSuccess, setCfgSuccess] = useState(false);

  // --- Agenda (lista) ---
  const [items, setItems] = useState<B2BAgendaItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<B2BAgendaItem | null>(null);
  const [form, setForm] = useState<AgendaForm>(emptyAgenda);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    setListError(null);
    try {
      const data = await listB2BAgenda();
      setItems(data.results);
    } catch (err) {
      setListError(formatApiError(err));
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getB2BConfig()
      .then((data) => active && setCfg(data))
      .catch(() => active && setCfgError("No se pudo cargar la configuración."))
      .finally(() => active && setLoadingCfg(false));
    loadItems();
    return () => {
      active = false;
    };
  }, [loadItems]);

  function setCfgField<K extends keyof B2BConfig>(key: K, value: B2BConfig[K]) {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
  }

  async function onSaveCfg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cfg) return;
    setCfgError(null);
    setCfgSuccess(false);
    setSavingCfg(true);
    try {
      const updated = await updateB2BConfig(cfg);
      setCfg(updated);
      setCfgSuccess(true);
    } catch (err) {
      setCfgError(formatApiError(err));
    } finally {
      setSavingCfg(false);
    }
  }

  // --- Agenda handlers ---
  function setField<K extends keyof AgendaForm>(key: K, value: AgendaForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyAgenda);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(it: B2BAgendaItem) {
    setEditing(it);
    setForm({
      day_label: it.day_label,
      title: it.title,
      time_range: it.time_range,
      sort_order: String(it.sort_order),
      is_active: it.is_active,
    });
    setFormError(null);
    setOpen(true);
  }

  async function onSaveItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!form.day_label.trim() || !form.title.trim()) {
      setFormError("El día y la actividad son obligatorios.");
      return;
    }
    const payload = {
      day_label: form.day_label.trim(),
      title: form.title.trim(),
      time_range: form.time_range.trim(),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateB2BAgendaItem(editing.id, payload);
      } else {
        await createB2BAgendaItem(payload);
      }
      setOpen(false);
      await loadItems();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteItem(it: B2BAgendaItem) {
    if (!window.confirm(`¿Eliminar "${it.day_label} — ${it.title}"?`)) return;
    try {
      await deleteB2BAgendaItem(it.id);
      await loadItems();
    } catch (err) {
      setListError(formatApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <Handshake className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Rueda de Negocios B2B</h1>
          <p className="text-sm text-foreground/70">
            Textos, tarjeta de inscripción y agenda de la sección B2B.
          </p>
        </div>
      </header>

      {/* ---------- Config ---------- */}
      {cfgSuccess && (
        <div className="mt-6 rounded-xl border border-emerald-300/50 bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
          Cambios guardados correctamente.
        </div>
      )}
      {cfgError && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {cfgError}
        </div>
      )}

      {loadingCfg || !cfg ? (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <form
          onSubmit={onSaveCfg}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Textos de la sección
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Etiqueta</Label>
              <Input
                className="mt-2"
                value={cfg.eyebrow}
                onChange={(e) => setCfgField("eyebrow", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Título</Label>
              <Input
                className="mt-2"
                value={cfg.title}
                onChange={(e) => setCfgField("title", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Descripción</Label>
            <Textarea
              className="mt-2"
              rows={2}
              value={cfg.description}
              onChange={(e) => setCfgField("description", e.target.value)}
            />
          </div>

          <h2 className="pt-2 text-sm font-semibold uppercase tracking-wider text-secondary">
            Tarjeta de inscripción
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Título de la tarjeta</Label>
              <Input
                className="mt-2"
                value={cfg.card_title}
                onChange={(e) => setCfgField("card_title", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Etiqueta de precio</Label>
              <Input
                className="mt-2"
                value={cfg.price_label}
                onChange={(e) => setCfgField("price_label", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Precio</Label>
              <Input
                className="mt-2"
                value={cfg.price}
                onChange={(e) => setCfgField("price", e.target.value)}
                placeholder="S/ 1,500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Nota de precio</Label>
              <Input
                className="mt-2"
                value={cfg.price_note}
                onChange={(e) => setCfgField("price_note", e.target.value)}
                placeholder="incluido IGV"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Qué incluye</Label>
            <Textarea
              className="mt-2"
              rows={2}
              value={cfg.includes_text}
              onChange={(e) => setCfgField("includes_text", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Texto del botón</Label>
            <Input
              className="mt-2"
              value={cfg.cta_label}
              onChange={(e) => setCfgField("cta_label", e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingCfg}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {savingCfg ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar textos
            </button>
          </div>
        </form>
      )}

      {/* ---------- Agenda ---------- */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary">Agenda</h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" /> Nueva fila
        </button>
      </div>

      {listError && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {listError}
        </div>
      )}

      <div className="mt-4">
        {loadingItems ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Aún no hay filas de agenda. Crea la primera con “Nueva fila”.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  #{it.sort_order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {it.day_label}
                    </span>
                    {!it.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold text-foreground">{it.title}</p>
                  {it.time_range && (
                    <p className="text-xs text-muted-foreground">{it.time_range}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => openEdit(it)}
                    aria-label="Editar fila"
                    className="rounded-full border border-border p-2 text-foreground/80 transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(it)}
                    aria-label="Eliminar fila"
                    className="rounded-full border border-red-300 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Diálogo crear / editar fila */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar fila" : "Nueva fila de agenda"}</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={onSaveItem} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Día *</Label>
              <Input
                className="mt-2"
                value={form.day_label}
                onChange={(e) => setField("day_label", e.target.value)}
                placeholder="Día 1 · 21 Oct"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Actividad *</Label>
              <Input
                className="mt-2"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Inauguración + Rueda B2B mañana"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Horario</Label>
                <Input
                  className="mt-2"
                  value={form.time_range}
                  onChange={(e) => setField("time_range", e.target.value)}
                  placeholder="09:00 — 13:00"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Orden</Label>
                <Input
                  className="mt-2"
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={(e) => setField("sort_order", e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setField("is_active", e.target.checked)}
              />
              Activo (visible en la landing)
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
                style={{ background: "var(--gradient-brand)" }}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
