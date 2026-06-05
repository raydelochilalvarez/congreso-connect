import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { logout } from "@/integrations/api/auth";

export const Route = createFileRoute("/backoffice")({
  head: () => ({
    meta: [{ title: "Backoffice — Muchik 2026" }],
  }),
  component: BackofficePage,
});

function BackofficePage() {
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <MuchikLogo />
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground/80 transition hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-5xl items-center justify-center px-4">
        <h1 className="text-6xl font-bold text-primary">Backoffice</h1>
      </main>
    </div>
  );
}
