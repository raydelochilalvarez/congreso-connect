import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError, mediaUrl } from "@/integrations/api/client";
import {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  type Banner,
} from "@/integrations/api/banners";

export const Route = createFileRoute("/backoffice/banners")({
  head: () => ({ meta: [{ title: "Banners — Backoffice" }] }),
  component: BannersAdminPage,
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
  eyebrow: string;
  title: string;
  subtitle: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  eyebrow: "",
  title: "",
  subtitle: "",
  sort_order: "0",
  is_active: true,
};

function BannersAdminPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBanners();
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
    setImageFile(null);
    setImagePreview(null);
    setCurrentImage(null);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({
      eyebrow: b.eyebrow,
      title: b.title,
      subtitle: b.subtitle,
      sort_order: String(b.sort_order),
      is_active: b.is_active,
    });
    setImageFile(null);
    setImagePreview(null);
    setCurrentImage(b.image);
    setFormError(null);
    setOpen(true);
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!editing && !imageFile) {
      setFormError("La imagen es obligatoria.");
      return;
    }
    const fd = new FormData();
    fd.append("eyebrow", form.eyebrow.trim());
    fd.append("title", form.title.trim());
    fd.append("subtitle", form.subtitle.trim());
    fd.append("sort_order", String(Number(form.sort_order) || 0));
    fd.append("is_active", form.is_active ? "true" : "false");
    if (imageFile) fd.append("image", imageFile);

    setSaving(true);
    try {
      if (editing) {
        await updateBanner(editing.id, fd);
      } else {
        await createBanner(fd);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(b: Banner) {
    const name = b.title || `Banner #${b.id}`;
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteBanner(b.id);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  const shownImage = imagePreview || mediaUrl(currentImage);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl">Banners del carrusel</h1>
            <p className="text-sm text-foreground/70">
              Imágenes y textos del carrusel principal del landing. Ordénalos con “Orden”.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" /> Nuevo banner
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
            Aún no hay banners. Crea el primero con “Nuevo banner”.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((b) => (
              <article
                key={b.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="aspect-[16/7] w-full shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-20 sm:w-36">
                  {mediaUrl(b.image) ? (
                    <img
                      src={mediaUrl(b.image) as string}
                      alt={b.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      #{b.sort_order}
                    </span>
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      {b.title || "(sin título)"}
                    </h2>
                    {!b.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {b.eyebrow && <p className="text-xs text-secondary">{b.eyebrow}</p>}
                  {b.subtitle && (
                    <p className="truncate text-xs text-muted-foreground">{b.subtitle}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => openEdit(b)}
                    aria-label="Editar banner"
                    className="rounded-full border border-border p-2 text-foreground/80 transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(b)}
                    aria-label="Eliminar banner"
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
            <DialogTitle>{editing ? "Editar banner" : "Nuevo banner"}</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-2">
              <div className="aspect-[16/7] w-full overflow-hidden rounded-xl border border-border bg-muted">
                {shownImage ? (
                  <img src={shownImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={onPickImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
              >
                <Camera className="h-4 w-4" /> {editing ? "Cambiar imagen" : "Subir imagen"}
              </button>
              <p className="text-xs text-muted-foreground">
                Recomendado: 1920×1080 px (horizontal). JPG, PNG o WebP.
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Etiqueta superior</Label>
              <Input
                className="mt-2"
                value={form.eyebrow}
                onChange={(e) => set("eyebrow", e.target.value)}
                placeholder="Feria Internacional de Turismo"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Título</Label>
              <Input
                className="mt-2"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="MUCHIK 2026"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Subtítulo</Label>
              <Input
                className="mt-2"
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="El punto donde el turismo se reinventa."
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
