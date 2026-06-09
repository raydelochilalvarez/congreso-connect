import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/integrations/api/client";
import { registerAsistente } from "@/integrations/api/auth";

export const Route = createFileRoute("/registro-asistente")({
  head: () => ({
    meta: [
      { title: "Registro de Asistentes — Muchik 2026" },
      { name: "description", content: "Crea tu cuenta para comprar entradas a la feria Muchik 2026 en Trujillo, Perú." },
    ],
  }),
  component: RegistroAsistentePage,
});

// Aplana los errores de DRF ({campo: [mensaje]}) en un texto legible.
function formatApiError(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const parts = Object.entries(err.data as Record<string, unknown>).map(
      ([campo, val]) => `${campo}: ${Array.isArray(val) ? val.join(" ") : String(val)}`,
    );
    if (parts.length) return parts.join(" · ");
  }
  if (err instanceof Error) return err.message;
  return "No se pudo completar el registro. Intenta nuevamente.";
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <Label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RegistroAsistentePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      // Crea la cuenta (rol 'user'), persiste los tokens (auto-login)…
      await registerAsistente({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
      });
      // …y vuelve al home, ya con la sesión iniciada.
      navigate({ to: "/" });
    } catch (err) {
      setError(formatApiError(err));
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="shrink-0">
            <MuchikLogo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-primary md:text-3xl">
            Muchik 2026 · Registro de Asistentes
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            Crea tu cuenta para comprar entradas y acceder al evento.
          </p>
          <p className="mt-3 text-sm text-foreground/70">
            Todos los campos marcados con
            <span className="mx-1 text-destructive">*</span>son obligatorios.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Correo electrónico" required hint="Ingresa el correo con el que crearás tu cuenta.">
            <Input
              type="email"
              required
              placeholder="tu@correo.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>

          <Field label="Crear contraseña" required hint="Mínimo 8 caracteres. Combina letras y números.">
            <Input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </Field>

          <Field label="Confirmar contraseña" required>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
            />
          </Field>

          <Field label="Nombres" required>
            <Input
              required
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
            />
          </Field>

          <Field label="Apellidos" required>
            <Input
              required
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
            />
          </Field>

          <Field label="Celular" hint="Opcional.">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              ¿Eres una empresa expositora?{" "}
              <Link to="/registro" className="font-semibold text-primary underline">
                Regístrate como expositor
              </Link>
            </p>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
