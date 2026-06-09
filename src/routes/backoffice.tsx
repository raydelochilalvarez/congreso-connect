import { createFileRoute, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LogOut,
  Menu,
  Receipt,
  Store,
  Ticket,
  UserCog,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrentUser } from "@/hooks/use-current-user";
import { userInitials } from "@/integrations/api/auth";

export const Route = createFileRoute("/backoffice")({
  head: () => ({
    meta: [{ title: "Backoffice — Muchik 2026" }],
  }),
  component: BackofficeLayout,
});

const COLLAPSE_KEY = "cc_sidebar_collapsed";

type NavLeaf = { to: string; label: string; icon: LucideIcon };
type NavGroupItem = { label: string; icon: LucideIcon; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroupItem;

const menu: NavItem[] = [
  {
    label: "Reservas",
    icon: Receipt,
    children: [
      { to: "/backoffice/ordenes", label: "Entradas", icon: Ticket },
      { to: "/backoffice/reservas", label: "Stands", icon: Store },
    ],
  },
  { to: "/backoffice/expositores", label: "Aprobar expositores", icon: ClipboardCheck },
  { to: "/backoffice/entradas", label: "Catálogo de entradas", icon: Ticket },
  { to: "/backoffice/stands", label: "Catálogo de stands", icon: Store },
];

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavLeaf;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      activeProps={{ className: "bg-secondary/10 text-secondary" }}
      className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-muted ${
        collapsed ? "justify-center px-2" : "px-3"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && item.label}
    </Link>
  );
}

function NavGroup({ item, onNavigate }: { item: NavGroupItem; onNavigate?: () => void }) {
  const [open, setOpen] = useState(true);
  const Icon = item.icon;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-muted"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="ml-3 mt-1 space-y-1 border-l border-border pl-2">
          {item.children.map((c) => (
            <NavLink key={c.to} item={c} collapsed={false} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  collapsed,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex h-16 shrink-0 items-center border-b border-border ${
          collapsed ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        {!collapsed && (
          <Link to="/" onClick={onNavigate}>
            <MuchikLogo />
          </Link>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menú" : "Recoger menú"}
            className="rounded-md p-1.5 text-foreground/60 transition hover:bg-muted"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menu.map((item) =>
          "children" in item ? (
            collapsed ? (
              <Fragment key={item.label}>
                {item.children.map((c) => (
                  <NavLink key={c.to} item={c} collapsed onNavigate={onNavigate} />
                ))}
              </Fragment>
            ) : (
              <NavGroup key={item.label} item={item} onNavigate={onNavigate} />
            )
          ) : (
            <NavLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      {!collapsed && (
        <div className="border-t border-border p-3">
          <p className="px-3 py-2 text-xs text-muted-foreground">Panel de administración</p>
        </div>
      )}
    </div>
  );
}

function BackofficeLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user, loading, logout } = useCurrentUser();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restaura el estado recogido/extendido (cliente; evita desajuste de hidratación).
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  // Guarda de acceso (UX): solo admin. La seguridad real la exige el backend.
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
      {/* Sidebar fijo (escritorio), recogible */}
      <aside
        className={`hidden shrink-0 border-r border-border bg-background transition-[width] duration-200 lg:block ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="sticky top-0 h-screen">
          <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapse} />
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
            <SidebarContent collapsed={false} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* Columna de contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-2 px-4 py-3 lg:px-6">
            {/* Atrás (todas las vistas, útil en móvil) */}
            <button
              type="button"
              onClick={() => router.history.back()}
              aria-label="Atrás"
              className="rounded-md p-2 text-foreground/70 transition hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Abrir menú (solo móvil) */}
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Abrir menú"
              className="rounded-md p-2 text-primary transition hover:bg-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="ml-auto">
              <Popover>
                <PopoverTrigger
                  aria-label="Mi cuenta"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
                  style={{ background: "var(--gradient-brand)" }}
                  title={user.full_name}
                >
                  {userInitials(user)}
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <div className="space-y-1">
                    <div className="px-2 pb-2">
                      <p className="text-sm font-semibold text-foreground">{user.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                        {user.role_display}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <Link
                      to="/backoffice/perfil"
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                    >
                      <UserCog className="h-4 w-4" /> Editar perfil
                    </Link>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
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
