import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardCheck, LogOut, Menu, X } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { useCurrentUser } from "@/hooks/use-current-user";
import { userInitials } from "@/integrations/api/auth";

export const Route = createFileRoute("/backoffice")({
  head: () => ({
    meta: [{ title: "Backoffice — Muchik 2026" }],
  }),
  component: BackofficeLayout,
});

const menu = [
  { to: "/backoffice/expositores", label: "Aprobar expositores", icon: ClipboardCheck },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Link to="/" onClick={onNavigate}>
          <MuchikLogo />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {menu.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeProps={{ className: "bg-secondary/10 text-secondary" }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-muted"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <p className="px-3 py-2 text-xs text-muted-foreground">Panel de administración</p>
      </div>
    </div>
  );
}

function BackofficeLayout() {
  const navigate = useNavigate();
  const { user, loading, logout } = useCurrentUser();
  const [drawer, setDrawer] = useState(false);

  // Guarda de acceso (UX): solo admin. La seguridad real la exige el backend
  // en cada endpoint; esto solo evita mostrar la vista a quien no corresponde.
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  async function onLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-muted/30 lg:flex">
      {/* Sidebar fijo (escritorio) */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-background lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Drawer (móvil) */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawer(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-background shadow-xl">
            <button
              onClick={() => setDrawer(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-4 rounded-md p-1.5 text-foreground/70 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* Columna de contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Abrir menú"
              className="rounded-md p-2 text-primary lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden text-sm font-medium text-foreground/70 lg:block">
              Backoffice
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)]"
                style={{ background: "var(--gradient-brand)" }}
                title={user.full_name}
              >
                {userInitials(user)}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-muted sm:px-4 sm:text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
