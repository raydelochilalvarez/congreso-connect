import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/integrations/api/client";
import {
  listTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  formatPrice,
  CURRENCIES,
  type TicketType,
  type Currency,
} from "@/integrations/api/ticket-types";

export const Route = createFileRoute("/backoffice/entradas")({
  head: () => ({ meta: [{ title: "Entradas — Backoffice" }] }),
  component: EntradasAdminPage,
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
  description: string;
  price: string;
  currency: Currency;
  capacity: string;
  sort_order: string;
  is_popular: boolean;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  currency: "PEN",
  capacity: "",
  sort_order: "0",
  is_popular: false,
  is_active: true,
};

function EntradasAdminPage() {
  const [items, setItems] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TicketType | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTicketTypes();
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

  function openEdit(t: TicketType) {
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description,
      price: t.price,
      currency: t.currency,
      capacity: t.capacity != null ? String(t.capacity) : "",
      sort_order: String(t.sort_order),
      is_popular: t.is_popular,
      is_active: t.is_active,
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
      description: form.description.trim(),
      price: form.price,
      currency: form.currency,
      capacity: form.capacity === "" ? null : Number(form.capacity),
      sort_order: Number(form.sort_order) || 0,
      is_popular: form.is_popular,
      is_active: form.is_active,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateTicketType(editing.id, payload);
      } else {
        await createTicketType(payload);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(t: TicketType) {
    if (!window.confirm(`¿Eliminar la entrada "${t.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await deleteTicketType(t.id);
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
            <Ticket className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl">Entradas</h1>
            <p className="text-sm text-foreground/70">
              Configura los tipos de entrada, precios y disponibilidad.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" /> Nueva entrada
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
            Aún no hay tipos de entrada. Crea el primero con “Nueva entrada”.
          </div>
        ) : (
          items.map((t) => (
            <article key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{t.name}</h2>
                    {t.is_popular && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground">
                        Destacada
                      </span>
                    )}
                    {!t.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {formatPrice(t.price, t.currency)}
                  </p>
                  {t.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cupo: {t.capacity != null ? t.capacity : "sin límite"} · Orden: {t.sort_order}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(t)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button
                    onClick={() => onDelete(t)}
                    aria-label={`Eliminar ${t.name}`}
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
            <DialogTitle>{editing ? "Editar entrada" : "Nueva entrada"}</DialogTitle>
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
                placeholder="Premium"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Descripción</Label>
              <Textarea
                className="mt-2"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Acceso completo + Foro Internacional…"
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
                  placeholder="120.00"
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

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={form.is_popular}
                  onChange={(e) => set("is_popular", e.target.checked)}
                />
                Destacada
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                />
                Activa (visible en la landing)
              </label>
            </div>

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
