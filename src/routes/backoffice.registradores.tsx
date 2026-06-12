import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/integrations/api/client";
import { listRegistradores, createUser, type AdminUser } from "@/integrations/api/users";

export const Route = createFileRoute("/backoffice/registradores")({
  head: () => ({ meta: [{ title: "Registradores — Backoffice" }] }),
  component: RegistradoresAdminPage,
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

function initials(u: AdminUser): string {
  const a = u.first_name?.[0] ?? "";
  const b = u.last_name?.[0] ?? "";
  const ini = (a + b).trim();
  return (ini || u.email[0] || "?").toUpperCase();
}

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

const emptyForm: FormState = { first_name: "", last_name: "", email: "", password: "" };

function RegistradoresAdminPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRegistradores();
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
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError("Nombres y apellidos son obligatorios.");
      return;
    }
    if (!form.email.trim()) {
      setFormError("El email es obligatorio.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSaving(true);
    try {
      await createUser({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "registrador",
      });
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <ScanLine className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl">Registradores</h1>
            <p className="text-sm text-foreground/70">
              Personal que escanea el QR para verificar las entradas en el acceso.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" /> Nuevo registrador
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
            Aún no hay registradores. Crea el primero con “Nuevo registrador”.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((u) => (
              <article
                key={u.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)]"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {initials(u)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      {u.full_name}
                    </h2>
                    {!u.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo crear */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo registrador</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={onSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Nombres *</Label>
                <Input
                  className="mt-2"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Apellidos *</Label>
                <Input
                  className="mt-2"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  placeholder="Pérez"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Email *</Label>
              <Input
                className="mt-2"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="registrador@muchik.pe"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Contraseña *</Label>
              <Input
                className="mt-2"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Con estas credenciales el registrador inicia sesión para escanear entradas.
              </p>
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
                Crear
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
