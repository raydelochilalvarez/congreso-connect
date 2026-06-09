import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Loader2, LogOut, Store } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { useCurrentUser } from "@/hooks/use-current-user";
import { readableApiError } from "@/integrations/api/client";
import { formatPrice } from "@/integrations/api/ticket-types";
import { listPublicStandTypes, splitIncludes, type PublicStandType } from "@/integrations/api/stand-types";
import {
  createReservation,
  listMyReservations,
  type StandReservation,
  type ReservationStatus,
} from "@/integrations/api/stand-reservations";

export const Route = createFileRoute("/expositor")({
  head: () => ({
    meta: [
      { title: "Panel de Expositor — Muchik 2026" },
      { name: "description", content: "Área privada para empresas expositoras de la feria Muchik 2026." },
    ],
  }),
  component: ExpositorPage,
});

const statusStyles: Record<ReservationStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function ApprovedPanel({ name }: { name: string }) {
  const [stands, setStands] = useState<PublicStandType[]>([]);
  const [reservations, setReservations] = useState<StandReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listPublicStandTypes(), listMyReservations()])
      .then(([s, r]) => {
        if (!active) return;
        setStands(s);
        setReservations(r.results);
      })
      .catch(() => active && setError("No se pudo cargar la información."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function reserve(standTypeId: number) {
    setReservingId(standTypeId);
    setError(null);
    try {
      await createReservation(standTypeId, 1);
      const r = await listMyReservations();
      setReservations(r.results);
    } catch (err) {
      setError(readableApiError(err, "No se pudo reservar el stand."));
    } finally {
      setReservingId(null);
    }
  }

  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Panel de Expositor</h1>
          <p className="text-sm text-foreground/70">Bienvenido, {name}. Tu empresa está aprobada.</p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <>
          {/* Reservar stand */}
          <h2 className="mt-8 text-lg font-bold text-foreground">Reservar stand</h2>
          {stands.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No hay stands disponibles por ahora.</p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {stands.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground">Stand {s.name}</h3>
                  {s.dimensions && <p className="text-sm text-muted-foreground">{s.dimensions}</p>}
                  <p className="mt-2 text-xl font-bold text-foreground">
                    {formatPrice(s.price, s.currency)}
                    {s.price_plus_igv && <span className="text-sm font-medium"> + IGV</span>}
                  </p>
                  {splitIncludes(s.includes).length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                      {splitIncludes(s.includes).map((line, i) => (
                        <li key={i}>· {line}</li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => reserve(s.id)}
                    disabled={reservingId === s.id}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {reservingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Reservar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mis reservas */}
          <h2 className="mt-10 text-lg font-bold text-foreground">Mis reservas</h2>
          {reservations.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Todavía no tienes reservas.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {reservations.map((r) => (
                <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">Stand {r.stand_type_name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[r.status]}`}
                        >
                          {r.status_display}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/75">
                        {r.quantity} × {formatPrice(r.unit_price, r.currency)}
                      </p>
                      {r.status === "pending" && (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Pendiente de pago.</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {formatPrice(r.total_amount, r.currency)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ExpositorPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user, loading, logout } = useCurrentUser();

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.history.back()}
              aria-label="Atrás"
              className="rounded-md p-2 text-foreground/70 transition hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Link to="/" className="shrink-0">
              <MuchikLogo />
            </Link>
          </div>
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
          <ApprovedPanel name={user.full_name} />
        ) : (
          <section className="mx-auto max-w-xl">
            <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-8 text-center dark:bg-amber-950/20">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40">
                <Clock className="h-7 w-7" />
              </span>
              <h1 className="mt-5 text-2xl font-bold text-primary">En espera de aprobación</h1>
              <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                Tu registro como expositor (<strong>{user.full_name}</strong>) fue recibido y está{" "}
                <strong>pendiente de revisión</strong> por la organización del evento. Te avisaremos
                apenas sea aprobado.
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
