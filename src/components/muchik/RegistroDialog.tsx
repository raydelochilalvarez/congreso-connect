import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
};

export function RegistroDialog({ children, className, style, ariaLabel }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label={ariaLabel} className={className} style={style}>
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold italic text-primary">
            Acceso a Muchik 2026
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <span className="text-sm text-foreground/80">Ya tengo cuenta</span>
            <Link
              to="/login"
              className="rounded-full border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5"
            >
              Inicia sesión
            </Link>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <span className="text-sm text-foreground/80">No tengo cuenta</span>
            <Link
              to="/registro"
              className="rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
              style={{ background: "var(--gradient-brand)" }}
            >
              Regístrate
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}