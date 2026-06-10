import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mic, Pencil, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError, mediaUrl } from "@/integrations/api/client";
import {
  listSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  speakerInitials,
  type Speaker,
} from "@/integrations/api/speakers";

export const Route = createFileRoute("/backoffice/disertantes")({
  head: () => ({ meta: [{ title: "Disertantes — Backoffice" }] }),
  component: DisertantesAdminPage,
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
  role: string;
  position: string;
  topic: string;
  bio: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  role: "",
  position: "",
  topic: "",
  bio: "",
  sort_order: "0",
  is_active: true,
};

function DisertantesAdminPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Speaker | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSpeakers();
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
    setPhotoFile(null);
    setPhotoPreview(null);
    setCurrentPhoto(null);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(s: Speaker) {
    setEditing(s);
    setForm({
      name: s.name,
      role: s.role,
      position: s.position,
      topic: s.topic,
      bio: s.bio,
      sort_order: String(s.sort_order),
      is_active: s.is_active,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setCurrentPhoto(s.photo);
    setFormError(null);
    setOpen(true);
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("role", form.role.trim());
    fd.append("position", form.position.trim());
    fd.append("topic", form.topic.trim());
    fd.append("bio", form.bio.trim());
    fd.append("sort_order", String(Number(form.sort_order) || 0));
    fd.append("is_active", form.is_active ? "true" : "false");
    if (photoFile) fd.append("photo", photoFile);

    setSaving(true);
    try {
      if (editing) {
        await updateSpeaker(editing.id, fd);
      } else {
        await createSpeaker(fd);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(s: Speaker) {
    if (!window.confirm(`¿Eliminar a "${s.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteSpeaker(s.id);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  const shownPhoto = photoPreview || mediaUrl(currentPhoto);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Mic className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl">Disertantes</h1>
            <p className="text-sm text-foreground/70">Gestiona los ponentes del Foro Internacional.</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" /> Nuevo disertante
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
            Aún no hay disertantes. Crea el primero con “Nuevo disertante”.
          </div>
        ) : (
          items.map((s) => (
            <article key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  {mediaUrl(s.photo) ? (
                    <img
                      src={mediaUrl(s.photo) as string}
                      alt={s.name}
                      className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary">
                      {speakerInitials(s.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{s.name}</h2>
                      {!s.is_active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {s.role && <p className="text-sm text-secondary">{s.role}</p>}
                    {s.position && <p className="text-xs text-muted-foreground">{s.position}</p>}
                    {s.topic && <p className="mt-1 text-sm text-foreground/75">Tema: {s.topic}</p>}
                  </div>
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
            <DialogTitle>{editing ? "Editar disertante" : "Nuevo disertante"}</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={onSave} className="space-y-4">
            {/* Foto */}
            <div className="flex items-center gap-4">
              {shownPhoto ? (
                <img src={shownPhoto} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-base font-semibold text-secondary">
                  {speakerInitials(form.name)}
                </span>
              )}
              <div>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={onPickPhoto}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
                >
                  <Camera className="h-4 w-4" /> Foto
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Nombre *</Label>
              <Input className="mt-2" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="María Fernández" />
            </div>
            <div>
              <Label className="text-sm font-medium">Rol</Label>
              <Input className="mt-2" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Mintur Chile · País invitado" />
            </div>
            <div>
              <Label className="text-sm font-medium">Cargo</Label>
              <Input className="mt-2" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Directora de Promoción Internacional…" />
            </div>
            <div>
              <Label className="text-sm font-medium">Tema en el foro</Label>
              <Input className="mt-2" value={form.topic} onChange={(e) => set("topic", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium">Biografía</Label>
              <Textarea className="mt-2" rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <div>
                <Label className="text-sm font-medium">Orden</Label>
                <Input className="mt-2" type="number" min="0" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                Activo (visible en la landing)
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
