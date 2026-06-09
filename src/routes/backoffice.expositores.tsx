import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Building2, Check, Loader2, X } from "lucide-react";
import {
  listExpositores,
  approveExpositor,
  rejectExpositor,
  type ExpositorAdmin,
  type ExpositorStatus,
} from "@/integrations/api/expositores";

export const Route = createFileRoute("/backoffice/expositores")({
  head: () => ({
    meta: [{ title: "Aprobar expositores — Backoffice" }],
  }),
  component: AprobarExpositoresPage,
});

const TABS: { value: ExpositorStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "rejected", label: "Rechazados" },
];

const statusStyles: Record<ExpositorStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function AprobarExpositoresPage() {
  const [tab, setTab] = useState<ExpositorStatus>("pending");
  const [items, setItems] = useState<ExpositorAdmin[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async (status: ExpositorStatus) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listExpositores(status);
      setItems(data.results);
      setCount(data.count);
    } catch {
      setError("No se pudieron cargar los expositores. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function act(id: number, action: "approve" | "reject") {
    setActingId(id);
    setError(null);
    try {
      await (action === "approve" ? approveExpositor(id) : rejectExpositor(id));
      // El item cambia de estado y sale de la pestaña actual.
      await load(tab);
    } catch {
      setError("No se pudo actualizar el expositor. Intenta nuevamente.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Expositores</h1>
          <p className="text-sm text-foreground/70">
            Revisa y aprueba las empresas que solicitan exponer en el evento.
          </p>
        </div>
      </header>

      {/* Pestañas por estado */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "text-primary-foreground shadow-[var(--shadow-brand)]"
                  : "border border-border text-foreground/70 hover:bg-muted"
              }`}
              style={active ? { background: "var(--gradient-brand)" } : undefined}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Contenido */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No hay expositores en este estado.
          </div>
        ) : (
          items.map((e) => (
            <article
              key={e.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {e.razon_social}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[e.approval_status]}`}
                    >
                      {e.approval_status_display}
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-foreground/75 sm:grid-cols-2">
                    <div>
                      <dt className="inline text-muted-foreground">RUC/Doc: </dt>
                      <dd className="inline">{e.ruc}</dd>
                    </div>
                    <div>
                      <dt className="inline text-muted-foreground">Contacto: </dt>
                      <dd className="inline">{e.user.full_name}</dd>
                    </div>
                    <div className="min-w-0 truncate">
                      <dt className="inline text-muted-foreground">Correo: </dt>
                      <dd className="inline">{e.user.email}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex shrink-0 gap-2">
                  {e.approval_status !== "approved" && (
                    <button
                      onClick={() => act(e.id, "approve")}
                      disabled={actingId === e.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actingId === e.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Aprobar
                    </button>
                  )}
                  {e.approval_status !== "rejected" && (
                    <button
                      onClick={() => act(e.id, "reject")}
                      disabled={actingId === e.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/30"
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}

        {!loading && count > items.length && (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Mostrando {items.length} de {count}. La paginación se agregará en un
            siguiente paso.
          </p>
        )}
      </div>
    </div>
  );
}
