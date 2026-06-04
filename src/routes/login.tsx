import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Inicia sesión — Muchik 2026" },
      { name: "description", content: "Inicia sesión en tu cuenta de Muchik 2026 con tu correo y contraseña." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
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

      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-primary">Inicia sesión</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Ingresa con el correo y la contraseña que creaste en tu registro.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/70">
            ¿Aún no tienes cuenta?{" "}
            <Link to="/registro" className="font-semibold text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}