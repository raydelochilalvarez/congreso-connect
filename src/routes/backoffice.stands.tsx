import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/integrations/api/client";
import { formatPrice, CURRENCIES, type Currency } from "@/integrations/api/ticket-types";
import {
  listStandTypes,
  createStandType,
  updateStandType,
  deleteStandType,
  splitIncludes,
  type StandType,
} from "@/integrations/api/stand-types";

export const Route = createFileRoute("/backoffice/stands")({
  head: () => ({ meta: [{ title: "Stands — Backoffice" }] }),
  component: StandsAdminPage,
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

type FormState = {
  name: string;
  dimensions: string;
  price: string;
  currency: Currency;
  price_plus_igv: boolean;
  includes: string;
  capacity: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  dimensions: "",
  price: "",
  currency: "PEN",
  price_plus_igv: true,
  includes: "",
  capacity: "",
  sort_order: "0",
  is_active: true,
};

function StandsAdminPage() {
  const [items, setItems] = useState<StandType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StandType | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStandTypes();
      setItems(data.results);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(s: StandType) {
    setEditing(s);
    setForm({
      name: s.name,
      dimensions: s.dimensions,
      price: s.price,
      currency: s.currency,
      price_plus_igv: s.price_plus_igv,
      includes: s.includes,
      capacity: s.capacity != null ? String(s.capacity) : "",
      sort_order: String(s.sort_order),
      is_active: s.is_active,
    });
    setFormError(null);
    setOpen(true);
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || form.price === "") {
      setFormError("Nombre y precio son obligatorios.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      dimensions: form.dimensions.trim(),
      price: form.price,
      currency: form.currency,
      price_plus_igv: form.price_plus_igv,
      includes: form.includes,
      capacity: form.capacity === "" ? null : Number(form.capacity),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateStandType(editing.id, payload);
      } else {
        await createStandType(payload);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(s: StandType) {
    if (!window.confirm(`¿Eliminar el stand "${s.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await deleteStandType(s.id);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl">Stands</h1>
            <p className="text-sm text-foreground/70">
              Configura los tipos de stand, precios y disponibilidad.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" /> Nuevo stand
        </button>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Aún no hay tipos de stand. Crea el primero con “Nuevo stand”.
          </div>
        ) : (
          items.map((s) => (
            <article key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{s.name}</h2>
                    {!s.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {s.dimensions && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.dimensions}</p>
                  )}
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {formatPrice(s.price, s.currency)}
                    {s.price_plus_igv && <span className="text-sm font-medium"> + IGV</span>}
                  </p>
                  {splitIncludes(s.includes).length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                      {splitIncludes(s.includes).map((line, i) => (
                        <li key={i}>· {line}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cupo: {s.capacity != null ? s.capacity : "sin límite"} · Orden: {s.sort_order}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    aria-label={`Eliminar ${s.name}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Diálogo crear / editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar stand" : "Nuevo stand"}</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={onSave} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Nombre *</Label>
              <Input
                className="mt-2"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="6 m²"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Dimensiones</Label>
              <Input
                className="mt-2"
                value={form.dimensions}
                onChange={(e) => set("dimensions", e.target.value)}
                placeholder="3m × 2m × 2.5m altura"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Precio *</Label>
                <Input
                  className="mt-2"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="1500.00"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Moneda</Label>
                <select
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value as Currency)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={form.price_plus_igv}
                onChange={(e) => set("price_plus_igv", e.target.checked)}
              />
              Mostrar “+ IGV” junto al precio
            </label>

            <div>
              <Label className="text-sm font-medium">Qué incluye</Label>
              <p className="mt-1 text-xs text-muted-foreground">Un ítem por línea.</p>
              <Textarea
                className="mt-2"
                rows={4}
                value={form.includes}
                onChange={(e) => set("includes", e.target.value)}
                placeholder={"Mesa, sillas, friso institucional\nWiFi, mantelería\nPersonal de logística"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Cupo</Label>
                <Input
                  className="mt-2"
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                  placeholder="Sin límite"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Orden</Label>
                <Input
                  className="mt-2"
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={(e) => set("sort_order", e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
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
