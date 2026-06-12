import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, ScanQrCode } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/registrador")({
  head: () => ({ meta: [{ title: "Escaneo de entradas — Muchik 2026" }] }),
  component: RegistradorView,
});

function RegistradorView() {
  const navigate = useNavigate();
  const { user, loading, logout } = useCurrentUser();

  // Guarda de acceso (UX): solo el rol registrador entra aquí. La seguridad
  // real la exige el backend cuando exista el endpoint de validación de QR.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (user.role !== "registrador") {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  if (loading || !user || user.role !== "registrador") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  async function onLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Cerrar sesión discreto (la vista de escaneo aún no está construida). */}
      <button
        type="button"
        onClick={onLogout}
        className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted"
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>

      <ScanQrCode
        className="h-44 w-44 animate-pulse text-primary sm:h-64 sm:w-64"
        strokeWidth={1.25}
      />
      <p className="mt-6 text-lg font-semibold text-foreground/80">Escaneando…</p>
    </div>
  );
}
