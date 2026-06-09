import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/integrations/api/client";
import { getCurrentUser, updateMyProfile, userInitials } from "@/integrations/api/auth";

export const Route = createFileRoute("/backoffice/perfil")({
  head: () => ({
    meta: [{ title: "Editar perfil — Backoffice" }],
  }),
  component: EditarPerfilPage,
});

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function mediaUrl(avatar: string | null): string | null {
  if (!avatar) return null;
  return avatar.startsWith("http") ? avatar : `${API_URL}${avatar}`;
}

function formatApiError(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const parts = Object.entries(err.data as Record<string, unknown>).map(
      ([campo, val]) => `${campo}: ${Array.isArray(val) ? val.join(" ") : String(val)}`,
    );
    if (parts.length) return parts.join(" · ");
  }
  if (err instanceof Error) return err.message;
  return "No se pudo guardar. Intenta nuevamente.";
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EditarPerfilPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [initials, setInitials] = useState("?");
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((u) => {
        if (!active) return;
        setFirstName(u.first_name);
        setLastName(u.last_name);
        setPhone(u.phone || "");
        setCurrentAvatar(u.avatar);
        setInitials(userInitials(u));
      })
      .catch(() => active && setError("No se pudo cargar tu perfil."))
      .finally(() => active && setLoadingData(false));
    return () => {
      active = false;
    };
  }, []);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword && newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const fd = new FormData();
    fd.append("first_name", firstName);
    fd.append("last_name", lastName);
    fd.append("phone", phone);
    if (avatarFile) fd.append("avatar", avatarFile);
    if (newPassword) {
      fd.append("current_password", currentPassword);
      fd.append("new_password", newPassword);
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile(fd);
      setCurrentAvatar(updated.avatar);
      setAvatarFile(null);
      setAvatarPreview(null);
      setInitials(userInitials(updated));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    );
  }

  const shownAvatar = avatarPreview || mediaUrl(currentAvatar);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-primary md:text-3xl">Editar perfil</h1>
      <p className="mt-1 text-sm text-foreground/70">
        Actualiza tus datos, tu avatar y tu contraseña.
      </p>

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

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* Avatar */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Label className="text-sm font-medium text-foreground">Foto de perfil</Label>
          <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
            {shownAvatar ? (
              <img
                src={shownAvatar}
                alt="Avatar"
                className="h-20 w-20 rounded-full border border-border object-cover"
              />
            ) : (
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-semibold text-primary-foreground shadow-[var(--shadow-brand)]"
                style={{ background: "var(--gradient-brand)" }}
              >
                {initials}
              </span>
            )}
            <div>
              <input
                ref={fileInput}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={onPickAvatar}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
              >
                <Camera className="h-4 w-4" /> Cambiar foto
              </button>
              <p className="mt-2 text-xs text-muted-foreground">JPG, PNG o WEBP.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombres">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Apellidos">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>

        <Field label="Celular">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>

        {/* Cambio de contraseña */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Label className="text-sm font-medium text-foreground">Cambiar contraseña</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Déjalo en blanco si no quieres cambiarla. Por seguridad, se exige tu
            contraseña actual.
          </p>
          <div className="mt-3 space-y-3">
            <Input
              type="password"
              placeholder="Contraseña actual"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Nueva contraseña (mín. 8)"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirmar nueva contraseña"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
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
    </div>
  );
}
