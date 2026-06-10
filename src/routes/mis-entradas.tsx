import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, QrCode, Ticket } from "lucide-react";
import { MuchikLogo } from "@/components/muchik/Logo";
import { getAccessToken, readableApiError } from "@/integrations/api/client";
import { sendMyQr } from "@/integrations/api/auth";
import { formatPrice } from "@/integrations/api/ticket-types";
import { listMyOrders, type Order, type OrderStatus } from "@/integrations/api/orders";

export const Route = createFileRoute("/mis-entradas")({
  head: () => ({
    meta: [{ title: "Mis entradas — Muchik 2026" }],
  }),
  component: MisEntradasPage,
});

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function MisEntradasPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingQr, setSendingQr] = useState(false);
  const [qrMsg, setQrMsg] = useState<string | null>(null);

  async function onSendQr() {
    setSendingQr(true);
    setQrMsg(null);
    try {
      await sendMyQr();
      setQrMsg("Te enviamos tu código QR al correo.");
    } catch (err) {
      setQrMsg(readableApiError(err, "No se pudo enviar el QR."));
    } finally {
      setSendingQr(false);
    }
  }

  useEffect(() => {
    if (!getAccessToken()) {
      navigate({ to: "/login" });
      return;
    }
    let active = true;
    listMyOrders()
      .then((data) => active && setOrders(data.results))
      .catch(() => active && setError("No se pudieron cargar tus entradas."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
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

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Ticket className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl">Mis entradas</h1>
            <p className="text-sm text-foreground/70">Tus compras y su estado.</p>
          </div>
        </div>

        {/* Enviar mi QR de asistente por correo */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <QrCode className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Tu código QR de asistente</p>
              <p className="text-xs text-muted-foreground">Te lo enviamos al correo para el ingreso al evento.</p>
            </div>
          </div>
          <button
            onClick={onSendQr}
            disabled={sendingQr}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
            style={{ background: "var(--gradient-brand)" }}
          >
            {sendingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            Enviar mi QR al correo
          </button>
        </div>
        {qrMsg && <p className="mt-2 text-sm text-secondary">{qrMsg}</p>}

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
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Todavía no tienes entradas.{" "}
              <Link to="/" className="font-semibold text-primary underline">
                Ver entradas
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <article key={o.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{o.ticket_type_name}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[o.status]}`}
                      >
                        {o.status_display}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/75">
                      {o.quantity} × {formatPrice(o.unit_price, o.currency)}
                    </p>
                    {o.status === "pending" && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        Pendiente de pago.
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {formatPrice(o.total_amount, o.currency)}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
