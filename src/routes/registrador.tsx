import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut, Loader2, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { readableApiError } from "@/integrations/api/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { QrScanner } from "@/components/muchik/QrScanner";
import {
  listAttendance,
  scanAttendance,
  manualAttendance,
  type AttendanceRecord,
} from "@/integrations/api/attendance";

export const Route = createFileRoute("/registrador")({
  head: () => ({ meta: [{ title: "Control de aforo — Muchik 2026" }] }),
  component: RegistradorView,
});

type Feedback = { kind: "ok" | "dup" | "err"; message: string };

function RegistradorView() {
  const navigate = useNavigate();
  const { user, loading, logout } = useCurrentUser();

  const [aforo, setAforo] = useState(0);
  const [recent, setRecent] = useState<AttendanceRecord[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [paused, setPaused] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ first_name: "", last_name: "", dni: "" });
  const [manualError, setManualError] = useState<string | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  // Guarda de acceso (UX): solo el rol registrador. La seguridad real la exige
  // el backend (permiso view/create:attendance).
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

  const refresh = useCallback(async () => {
    try {
      const data = await listAttendance();
      setAforo(data.count);
      setRecent(data.results.slice(0, 8));
    } catch {
      /* silencioso: el contador se actualiza en el próximo registro */
    }
  }, []);

  useEffect(() => {
    if (user?.role === "registrador") refresh();
  }, [user, refresh]);

  const showFeedback = useCallback((fb: Feedback) => {
    setFeedback(fb);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3500);
  }, []);

  async function handleScan(text: string) {
    setPaused(true);
    try {
      const res = await scanAttendance(text.trim());
      showFeedback({
        kind: res.created ? "ok" : "dup",
        message: `${res.attendance.full_name} — ${res.detail}`,
      });
      await refresh();
    } catch (err) {
      showFeedback({ kind: "err", message: readableApiError(err, "Código QR no válido.") });
    } finally {
      // Pequeño enfriamiento para no re-escanear el mismo QR de inmediato.
      setTimeout(() => setPaused(false), 1500);
    }
  }

  async function onManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setManualError(null);
    if (!manualForm.first_name.trim() || !manualForm.last_name.trim()) {
      setManualError("Nombres y apellidos son obligatorios.");
      return;
    }
    if (!manualForm.dni.trim()) {
      setManualError("El DNI es obligatorio.");
      return;
    }
    setSavingManual(true);
    try {
      const res = await manualAttendance({
        first_name: manualForm.first_name.trim(),
        last_name: manualForm.last_name.trim(),
        dni: manualForm.dni.trim(),
      });
      setManualOpen(false);
      setManualForm({ first_name: "", last_name: "", dni: "" });
      showFeedback({
        kind: res.created ? "ok" : "dup",
        message: `${res.attendance.full_name} — ${res.detail}`,
      });
      await refresh();
    } catch (err) {
      setManualError(readableApiError(err, "No se pudo registrar."));
    } finally {
      setSavingManual(false);
    }
  }

  async function onLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  if (loading || !user || user.role !== "registrador") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  const fbStyles: Record<Feedback["kind"], string> = {
    ok: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    dup: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    err: "border-destructive/30 bg-destructive/5 text-destructive",
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Barra superior */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">Control de aforo</p>
            <p className="truncate text-xs text-muted-foreground">{user.full_name}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {/* Contador de aforo */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Users className="h-7 w-7" />
          </span>
          <div>
            <p className="text-3xl font-bold leading-none text-primary">{aforo}</p>
            <p className="mt-1 text-sm text-foreground/70">personas dentro del evento</p>
          </div>
        </div>

        {/* Escáner */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-center text-sm font-medium text-foreground/70">
            Apunta la cámara al código QR del asistente
          </p>
          <QrScanner onScan={handleScan} paused={paused} />

          {feedback && (
            <div
              className={`mt-4 rounded-xl border p-3 text-center text-sm font-medium ${fbStyles[feedback.kind]}`}
            >
              {feedback.message}
            </div>
          )}
        </div>

        {/* Ingreso manual */}
        <button
          onClick={() => {
            setManualForm({ first_name: "", last_name: "", dni: "" });
            setManualError(null);
            setManualOpen(true);
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground/80 shadow-sm transition hover:bg-muted"
        >
          <UserPlus className="h-4 w-4" /> Ingreso manual
        </button>

        {/* Últimos registros */}
        {recent.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground/80">Últimos registros</p>
            <ul className="divide-y divide-border">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.full_name}</p>
                    {r.dni && <p className="text-xs text-muted-foreground">DNI {r.dni}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {r.method_display}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Diálogo de ingreso manual */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ingreso manual</DialogTitle>
          </DialogHeader>

          {manualError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {manualError}
            </div>
          )}

          <form onSubmit={onManualSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Nombres *</Label>
              <Input
                className="mt-2"
                value={manualForm.first_name}
                onChange={(e) => setManualForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="Juan"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Apellidos *</Label>
              <Input
                className="mt-2"
                value={manualForm.last_name}
                onChange={(e) => setManualForm((f) => ({ ...f, last_name: e.target.value }))}
                placeholder="Pérez"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">DNI *</Label>
              <Input
                className="mt-2"
                inputMode="numeric"
                value={manualForm.dni}
                onChange={(e) => setManualForm((f) => ({ ...f, dni: e.target.value }))}
                placeholder="12345678"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingManual}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-60"
                style={{ background: "var(--gradient-brand)" }}
              >
                {savingManual && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
