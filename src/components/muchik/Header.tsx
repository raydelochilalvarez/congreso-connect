import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { MuchikLogo } from "./Logo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const nav = [
  { label: "Feria", href: "#banner" },
  { label: "Sede", href: "#ubicacion" },
  { label: "Entradas", href: "#entradas" },
  { label: "Stands", href: "#stand" },
  { label: "Rueda B2B", href: "#rueda" },
  { label: "Conferencia", href: "#conferencia" },
  { label: "Patrocinios", href: "#patrocinios" },
  { label: "Live", href: "#live" },
  { label: "Prensa", href: "#prensa" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <a href="#top" className="shrink-0">
          <MuchikLogo />
        </a>
        <nav className="hidden items-center gap-6 text-base font-semibold text-foreground xl:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-secondary">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <a
            href="#contacto"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:text-secondary"
          >
            Contacto
          </a>
          <Popover>
            <PopoverTrigger
              className="rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
              style={{ background: "var(--gradient-brand)" }}
            >
              Registros
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground/80">Ya tengo cuenta</span>
                  <Link
                    to="/login"
                    className="rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
                  >
                    Inicia sesión
                  </Link>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground/80">No tengo cuenta</span>
                  <Link
                    to="/registro"
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    Regístrate
                  </Link>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-primary md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/85 hover:bg-muted"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground/80">Ya tengo cuenta</span>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary"
                >
                  Inicia sesión
                </Link>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground/80">No tengo cuenta</span>
                <Link
                  to="/registro"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  Regístrate
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}