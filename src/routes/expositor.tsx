import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Clock, LayoutDashboard, LogOut } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/expositor")({
  head: () => ({
    meta: [
      { title: "Panel de Expositor — Muchik 2026" },
      { name: "description", content: "Área privada para empresas expositoras de la feria Muchik 2026." },
    ],
  }),
  component: ExpositorPage,
});

function ExpositorPage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useCurrentUser();

  // Guarda de acceso: solo expositores. Cualquier otro caso vuelve al home.
  useEffect(() => {
    if (!loading && (!user || user.role !== "expositor")) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  if (loading || !user || user.role !== "expositor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  const approved = user.expositor_status === "approved";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="shrink-0">
            <MuchikLogo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-foreground/70 sm:inline">{user.full_name}</span>
            <button
              onClick={() => logout().then(() => navigate({ to: "/" }))}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {approved ? (
          <section>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <LayoutDashboard className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-primary md:text-3xl">
                  Panel de Expositor
                </h1>
                <p className="text-sm text-foreground/70">
                  Bienvenido, {user.full_name}. Tu empresa está aprobada.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aquí irá tu panel de expositor (stand, perfil de empresa, rueda de
              negocios). Lo construimos en el siguiente paso.
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-xl">
            <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-8 text-center dark:bg-amber-950/20">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40">
                <Clock className="h-7 w-7" />
              </span>
              <h1 className="mt-5 text-2xl font-bold text-primary">
                En espera de aprobación
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                Tu registro como expositor (<strong>{user.full_name}</strong>) fue
                recibido y está <strong>pendiente de revisión</strong> por la
                organización del evento. Te avisaremos apenas sea aprobado.
              </p>
              <Link
                to="/"
                className="mt-6 inline-block rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
              >
                Volver al inicio
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
