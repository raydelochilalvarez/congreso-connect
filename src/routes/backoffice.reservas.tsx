import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardList, Loader2, X } from "lucide-react";
import { ApiError } from "@/integrations/api/client";
import { formatPrice } from "@/integrations/api/ticket-types";
import {
  listAllReservations,
  markReservationPaid,
  cancelReservation,
  type AdminStandReservation,
  type ReservationStatus,
} from "@/integrations/api/stand-reservations";

export const Route = createFileRoute("/backoffice/reservas")({
  head: () => ({ meta: [{ title: "Reservas — Backoffice" }] }),
  component: ReservasAdminPage,
});

type TabValue = "" | ReservationStatus;

const TABS: { value: TabValue; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "paid", label: "Pagadas" },
  { value: "cancelled", label: "Canceladas" },
];

const statusStyles: Record<ReservationStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function formatApiError(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const parts = Object.values(err.data as Record<string, unknown>).map((v) =>
      Array.isArray(v) ? v.join(" ") : String(v),
    );
    if (parts.length) return parts.join(" · ");
  }
  return "No se pudo actualizar la reserva.";
}

function ReservasAdminPage() {
  const [tab, setTab] = useState<TabValue>("");
  const [items, setItems] = useState<AdminStandReservation[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async (status: TabValue) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAllReservations(status || undefined);
      setItems(data.results);
      setCount(data.count);
    } catch {
      setError("No se pudieron cargar las reservas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function act(id: number, action: "paid" | "cancel") {
    setActingId(id);
    setError(null);
    try {
      await (action === "paid" ? markReservationPaid(id) : cancelReservation(id));
      await load(tab);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Reservas de stand</h1>
          <p className="text-sm text-foreground/70">
            Reservas de expositores. Marca como pagada para confirmar (simula la pasarela).
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value || "all"}
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

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No hay reservas en este estado.
          </div>
        ) : (
          items.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      #{r.id} · Stand {r.stand_type_name}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[r.status]}`}
                    >
                      {r.status_display}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground/75">
                    {r.quantity} × {formatPrice(r.unit_price, r.currency)} ={" "}
                    <strong>{formatPrice(r.total_amount, r.currency)}</strong>
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {r.user.full_name} · {r.user.email}
                  </p>
                </div>

                {r.status !== "cancelled" && (
                  <div className="flex shrink-0 gap-2">
                    {r.status === "pending" && (
                      <button
                        onClick={() => act(r.id, "paid")}
                        disabled={actingId === r.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Marcar pagada
                      </button>
                    )}
                    <button
                      onClick={() => act(r.id, "cancel")}
                      disabled={actingId === r.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/30"
                    >
                      <X className="h-4 w-4" /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))
        )}

        {!loading && count > items.length && (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Mostrando {items.length} de {count}. La paginación se agregará en un siguiente paso.
          </p>
        )}
      </div>
    </div>
  );
}
