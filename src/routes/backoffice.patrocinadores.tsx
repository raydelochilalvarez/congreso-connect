import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Award, Camera, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError, mediaUrl } from "@/integrations/api/client";
import {
  listSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  type Sponsor,
} from "@/integrations/api/sponsors";

export const Route = createFileRoute("/backoffice/patrocinadores")({
  head: () => ({ meta: [{ title: "Patrocinadores — Backoffice" }] }),
  component: PatrocinadoresAdminPage,
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
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  sort_order: "0",
  is_active: true,
};

function PatrocinadoresAdminPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSponsors();
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
    setLogoFile(null);
    setLogoPreview(null);
    setCurrentLogo(null);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(s: Sponsor) {
    setEditing(s);
    setForm({
      name: s.name,
      sort_order: String(s.sort_order),
      is_active: s.is_active,
    });
    setLogoFile(null);
    setLogoPreview(null);
    setCurrentLogo(s.logo);
    setFormError(null);
    setOpen(true);
  }

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    // Debe haber un logo: archivo nuevo o (al editar) el ya existente.
    const hasLogo = Boolean(logoFile || currentLogo);
    if (!hasLogo) {
      setFormError("Sube un logo.");
      return;
    }
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("sort_order", String(Number(form.sort_order) || 0));
    fd.append("is_active", form.is_active ? "true" : "false");
    if (logoFile) fd.append("logo", logoFile);

    setSaving(true);
    try {
      if (editing) {
        await updateSponsor(editing.id, fd);
      } else {
        await createSponsor(fd);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(s: Sponsor) {
    if (!window.confirm(`¿Eliminar a "${s.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteSponsor(s.id);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  const shownLogo = logoPreview || mediaUrl(currentLogo) || null;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl">Patrocinadores</h1>
            <p className="text-sm text-foreground/70">
              Logos de marcas, gremios e instituciones aliadas.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" /> Nuevo patrocinador
        </button>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Aún no hay patrocinadores. Crea el primero con “Nuevo patrocinador”.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((s) => (
              <article
                key={s.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
                  {mediaUrl(s.logo) ? (
                    <img
                      src={mediaUrl(s.logo) as string}
                      alt={s.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Award className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground">{s.name}</h2>
                    {!s.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => openEdit(s)}
                    aria-label={`Editar ${s.name}`}
                    className="rounded-full border border-border p-2 text-foreground/80 transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    aria-label={`Eliminar ${s.name}`}
                    className="rounded-full border border-red-300 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo crear / editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar patrocinador" : "Nuevo patrocinador"}</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={onSave} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
                {shownLogo ? (
                  <img src={shownLogo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Award className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  onChange={onPickLogo}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
                >
                  <Camera className="h-4 w-4" /> Logo
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Nombre *</Label>
              <Input
                className="mt-2"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="CANATUR"
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
