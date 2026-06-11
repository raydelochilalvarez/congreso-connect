import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  MapPin,
  Ticket,
  Store,
  Users,
  Mic,
  Radio,
  Newspaper,
  Award,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { SectionTitle, ArrowBand } from "./SectionTitle";
import { RegistroDialog } from "./RegistroDialog";
import {
  getAccessToken,
  clearTokens,
  ApiError,
  readableApiError,
  mediaUrl,
} from "@/integrations/api/client";
import {
  listPublicTicketTypes,
  formatPrice,
  type PublicTicketType,
} from "@/integrations/api/ticket-types";
import {
  listPublicStandTypes,
  splitIncludes,
  type PublicStandType,
} from "@/integrations/api/stand-types";
import { createOrder } from "@/integrations/api/orders";
import {
  listPublicSpeakers,
  speakerInitials,
  type PublicSpeaker,
} from "@/integrations/api/speakers";
import { listPublicSponsors, type PublicSponsor } from "@/integrations/api/sponsors";
import {
  getPublicEventConfig,
  mapEmbedUrl,
  mapDirectionsUrl,
  type EventConfig,
} from "@/integrations/api/event-config";
import {
  getPublicB2BConfig,
  listPublicB2BAgenda,
  type B2BConfig,
  type PublicB2BAgendaItem,
} from "@/integrations/api/b2b";

const Section = ({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section id={id} className={`mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14 ${className}`}>
    {children}
  </section>
);

export function SobreMuchik() {
  return (
    <Section id="sobre-muchik">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold italic tracking-tight text-primary sm:text-5xl">
          Feria Muchik
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Muchik es la feria internacional de turismo más importante de la región noramazónica del
          Perú.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Esta es la XII edición de la feria y la realiza la Cámara de Turismo de La Libertad en
          cooperación con Promperú, Proinversión y las cámaras noramazónicas del Perú.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Muchik es el punto de encuentro donde más de 200 agencias, tour operadores, hoteles,
          diversas compañías, inversionistas, productos y destinos cierran negocios y crean alianzas
          estratégicas.
        </p>
      </div>
    </Section>
  );
}

export function Ubicacion() {
  const [cfg, setCfg] = useState<EventConfig | null>(null);

  useEffect(() => {
    let active = true;
    getPublicEventConfig()
      .then((data) => active && setCfg(data))
      .catch(() => {})
      .finally(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!cfg) {
    return (
      <Section id="ubicacion">
        <div className="text-center text-sm text-muted-foreground">Cargando…</div>
      </Section>
    );
  }

  return (
    <Section id="ubicacion">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-secondary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            Sede & Fecha
          </span>
          <h2 className="mt-4 text-4xl font-bold italic tracking-tight text-primary sm:text-5xl">
            {cfg.location_headline}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">{cfg.location_description}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card icon={<Calendar className="h-5 w-5" />} title="Fechas" body={cfg.dates} />
            <Card icon={<MapPin className="h-5 w-5" />} title="Sede" body={cfg.venue} />
            <Card
              icon={<Award className="h-5 w-5" />}
              title="País invitado"
              body={cfg.guest_country}
            />
            <Card
              icon={<Users className="h-5 w-5" />}
              title={cfg.previous_edition_label}
              body={cfg.previous_edition_stats}
            />
          </div>
        </div>
        <div className="relative">
          <div
            className="absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
            style={{ background: "var(--gradient-brand)" }}
          />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-1 shadow-[var(--shadow-brand)]">
            <iframe
              title={cfg.location_headline}
              src={mapEmbedUrl(cfg.map_query)}
              className="h-[420px] w-full rounded-2xl"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={mapDirectionsUrl(cfg.map_query)}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-lg transition hover:scale-[1.03]"
            >
              <MapPin className="h-4 w-4" />
              Cómo llegar
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition hover:border-secondary/40 hover:shadow-lg">
      <div className="flex items-center gap-2 text-secondary">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <p className="mt-2 text-base font-semibold text-foreground">{body}</p>
    </div>
  );
}

export function Entradas() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<PublicTicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  useEffect(() => {
    let active = true;
    listPublicTicketTypes()
      .then((data) => active && setTiers(data))
      .catch(() => active && setTiers([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function buy(ticketTypeId: number) {
    setBuyError(null);
    // Sin sesión → pedir iniciar sesión o registrarse (popup).
    if (!getAccessToken()) {
      setAuthPromptOpen(true);
      return;
    }
    setBuyingId(ticketTypeId);
    try {
      await createOrder(ticketTypeId, 1);
      navigate({ to: "/mis-entradas" });
    } catch (err) {
      // Token vencido/inválido → tratar como sesión cerrada y mostrar el popup.
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        setAuthPromptOpen(true);
        return;
      }
      setBuyError(readableApiError(err, "No se pudo procesar la compra. Intenta nuevamente."));
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <Section id="entradas" className="border-t border-border/60">
      <SectionTitle
        eyebrow="Público general"
        title="Entradas"
        description="Vive Muchik 2026. Asegura tu lugar."
      />

      {buyError && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
          {buyError}
        </div>
      )}

      {loading ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">Cargando entradas…</div>
      ) : tiers.length === 0 ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Las entradas estarán disponibles muy pronto.
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-6">
          {tiers.map((t) => {
            const isFree = Number(t.price) === 0;
            return (
              <div
                key={t.id}
                className="relative w-full max-w-xl rounded-2xl border border-secondary bg-card p-8 text-center shadow-[var(--shadow-brand)]"
              >
                {t.is_popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Más elegida
                  </span>
                )}
                <Ticket className="mx-auto h-8 w-8 text-secondary" />
                <h3 className="mt-4 text-3xl font-bold italic text-primary">{t.name}</h3>
                {!isFree && (
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {formatPrice(t.price, t.currency)}
                  </p>
                )}
                {t.description && (
                  <p className="mt-3 text-base text-muted-foreground">{t.description}</p>
                )}
                <button
                  onClick={() => buy(t.id)}
                  disabled={buyingId === t.id}
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {buyingId === t.id ? (
                    <>
                      Procesando… <Loader2 className="h-5 w-5 animate-spin" />
                    </>
                  ) : isFree ? (
                    <>
                      Regístrate y consigue tu entrada sin cargo <ArrowRight className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Comprar entrada <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inicia sesión para comprar</DialogTitle>
            <DialogDescription>
              Para comprar tu entrada primero inicia sesión. Si aún no tienes cuenta, regístrate; es
              rápido.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => navigate({ to: "/login" })}
              className="flex-1 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate({ to: "/registro-asistente" })}
              className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
              style={{ background: "var(--gradient-brand)" }}
            >
              Registrarme
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

export function Stand() {
  const navigate = useNavigate();
  const [stands, setStands] = useState<PublicStandType[]>([]);
  const [loading, setLoading] = useState(true);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  useEffect(() => {
    let active = true;
    listPublicStandTypes()
      .then((data) => active && setStands(data))
      .catch(() => active && setStands([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function reserve() {
    // Sin sesión → popup; con sesión → al panel del expositor (allí reserva).
    if (!getAccessToken()) {
      setAuthPromptOpen(true);
      return;
    }
    navigate({ to: "/expositor" });
  }

  return (
    <Section id="stand">
      <ArrowBand>Stands · Exhibición Comercial</ArrowBand>
      {loading ? (
        <div className="text-center text-sm text-muted-foreground">Cargando stands…</div>
      ) : stands.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground">
          Los stands estarán disponibles muy pronto.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {stands.map((s) => (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-7"
            >
              <Store className="h-8 w-8 text-secondary" />
              <h3 className="mt-3 text-3xl font-bold italic text-primary">Stand {s.name}</h3>
              {s.dimensions && <p className="mt-1 text-muted-foreground">{s.dimensions}</p>}
              <p className="mt-4 text-2xl font-bold text-foreground">
                {formatPrice(s.price, s.currency)}
                {s.price_plus_igv && " + IGV"}
              </p>
              {splitIncludes(s.includes).length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {splitIncludes(s.includes).map((line, i) => (
                    <li key={i}>· {line}</li>
                  ))}
                </ul>
              )}
              <button
                onClick={reserve}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                Reservar stand <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reserva tu stand</DialogTitle>
            <DialogDescription>
              Para reservar un stand inicia sesión con tu cuenta de expositor. Si aún no la tienes,
              regístrate como expositor.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => navigate({ to: "/login" })}
              className="flex-1 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate({ to: "/registro" })}
              className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95"
              style={{ background: "var(--gradient-brand)" }}
            >
              Registrarme como expositor
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

// Contenido por defecto: se muestra mientras carga y como respaldo si el admin
// aún no configuró la sección (la landing nunca queda vacía).
const fallbackB2BConfig: B2BConfig = {
  eyebrow: "B2B",
  title: "Rueda de Negocios",
  description:
    "Mesas exclusivas para reuniones estratégicas y alianzas comerciales con compradores nacionales e internacionales.",
  card_title: "Inscripción B2B",
  price_label: "Precio regular",
  price: "S/ 1,500",
  price_note: "incluido IGV",
  includes_text:
    "Incluye: table tent, dos sillas, WiFi, mantelería, conexión laptops, personal de logística.",
  cta_label: "Registrarme a la rueda",
};

const fallbackB2BAgenda: PublicB2BAgendaItem[] = [
  {
    id: -1,
    day_label: "Día 1 · 21 Oct",
    title: "Inauguración + Rueda B2B mañana",
    time_range: "09:00 — 13:00",
  },
  {
    id: -2,
    day_label: "Día 2 · 22 Oct",
    title: "Rueda B2B full-day + Foro Internacional",
    time_range: "09:00 — 18:00",
  },
  {
    id: -3,
    day_label: "Día 3 · 23 Oct",
    title: "Cierre B2B + Networking",
    time_range: "09:00 — 14:00",
  },
];

export function RuedaNegocios() {
  const [cfg, setCfg] = useState<B2BConfig>(fallbackB2BConfig);
  const [agenda, setAgenda] = useState<PublicB2BAgendaItem[]>(fallbackB2BAgenda);

  useEffect(() => {
    let active = true;
    getPublicB2BConfig()
      .then((data) => active && setCfg(data))
      .catch(() => {
        /* error de red → conserva el respaldo */
      });
    listPublicB2BAgenda()
      .then((items) => {
        if (active && items.length > 0) setAgenda(items);
      })
      .catch(() => {
        /* error de red → conserva el respaldo */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Section id="rueda" className="border-t border-border/60">
      <SectionTitle eyebrow={cfg.eyebrow} title={cfg.title} description={cfg.description} />
      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div
          className="rounded-2xl p-7 text-primary-foreground shadow-[var(--shadow-brand)]"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Users className="h-8 w-8" />
          <h3 className="mt-4 text-3xl font-bold italic">{cfg.card_title}</h3>
          {cfg.price_label && <p className="mt-2 text-white/90">{cfg.price_label}</p>}
          {cfg.price && <p className="mt-1 text-5xl font-bold">{cfg.price}</p>}
          {cfg.price_note && <p className="text-sm text-white/80">{cfg.price_note}</p>}
          {cfg.includes_text && <p className="mt-5 text-sm text-white/90">{cfg.includes_text}</p>}
          <RegistroDialog className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary">
            {cfg.cta_label} <ArrowRight className="h-4 w-4" />
          </RegistroDialog>
        </div>
        <div className="rounded-2xl border border-border bg-card p-7">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-secondary">Agenda</h4>
          <ul className="mt-4 divide-y divide-border">
            {agenda.map((a) => (
              <li key={a.id} className="flex items-start gap-4 py-4">
                <div className="w-32 shrink-0 text-xs font-bold uppercase tracking-wider text-primary">
                  {a.day_label}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.time_range}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function SpeakerAvatar({ speaker, size }: { speaker: PublicSpeaker; size: "lg" | "md" }) {
  const cls = size === "lg" ? "h-20 w-20" : "h-16 w-16";
  const photo = mediaUrl(speaker.photo);
  if (photo) {
    return (
      <img src={photo} alt={speaker.name} className={`${cls} shrink-0 rounded-full object-cover`} />
    );
  }
  return (
    <div
      className={`${cls} flex shrink-0 items-center justify-center rounded-full text-xl font-bold italic text-white`}
      style={{ background: "var(--gradient-brand)" }}
    >
      {speakerInitials(speaker.name)}
    </div>
  );
}

export function Conferencia() {
  const [speakers, setSpeakers] = useState<PublicSpeaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPublicSpeakers()
      .then((data) => active && setSpeakers(data))
      .catch(() => active && setSpeakers([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Section id="conferencia">
      <ArrowBand>Foro Internacional Muchik</ArrowBand>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Mic className="h-8 w-8 text-secondary" />
          <h3 className="mt-4 text-3xl font-bold italic text-primary">Disertantes</h3>
          <p className="mt-2 text-muted-foreground">
            Expertos, autoridades y profesionales analizan nuevas estrategias para diversificar la
            oferta turística del Perú.
          </p>
          <RegistroDialog
            className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            Reservar mi cupo <ArrowRight className="h-4 w-4" />
          </RegistroDialog>
        </div>
        {loading ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Cargando disertantes…
          </div>
        ) : speakers.length === 0 ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Pronto anunciaremos a los disertantes.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {speakers.map((s) => (
              <Dialog key={s.id}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-5 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-secondary/40 hover:shadow-md"
                  >
                    <SpeakerAvatar speaker={s} size="lg" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.role}</p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <SpeakerAvatar speaker={s} size="md" />
                      <div>
                        <DialogTitle className="text-2xl font-bold italic text-primary">
                          {s.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                          {s.role}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="mt-2 space-y-4">
                    {s.position && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                          Cargo
                        </p>
                        <p className="mt-1 text-sm text-foreground">{s.position}</p>
                      </div>
                    )}
                    {s.bio && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                          Biografía
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{s.bio}</p>
                      </div>
                    )}
                    {s.topic && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                          Tema en el Foro
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{s.topic}</p>
                      </div>
                    )}
                    <RegistroDialog
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground"
                      style={{ background: "var(--gradient-brand)" }}
                    >
                      Reservar mi cupo <ArrowRight className="h-4 w-4" />
                    </RegistroDialog>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

export function Patrocinios() {
  const [sponsors, setSponsors] = useState<PublicSponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPublicSponsors()
      .then((data) => active && setSponsors(data))
      .catch(() => active && setSponsors([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Tres filas para el efecto marquee (se desplazan en bucle, alternando sentido).
  const third = Math.ceil(sponsors.length / 3);
  const rows = [
    sponsors.slice(0, third),
    sponsors.slice(third, third * 2),
    sponsors.slice(third * 2),
  ];

  return (
    <Section id="patrocinios" className="border-t border-border/60">
      <SectionTitle
        eyebrow="Aliados"
        title="Patrocinios"
        description="Marcas, gremios e instituciones que hacen posible Muchik."
      />
      {loading ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Cargando patrocinadores…
        </div>
      ) : sponsors.length === 0 ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Pronto anunciaremos a nuestros aliados.
        </div>
      ) : (
        <div className="mt-12 space-y-4">
          {rows.map((row, i) =>
            row.length === 0 ? null : (
              <div
                key={i}
                className="overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
                }}
              >
                <div className={`marquee-row ${i === 1 ? "marquee-rtl" : "marquee-ltr"}`}>
                  {[...row, ...row].map((s, j) => {
                    const card = (
                      <div className="flex h-28 w-44 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-3 transition hover:border-secondary/40 hover:shadow-md">
                        {mediaUrl(s.logo) && (
                          <img
                            src={mediaUrl(s.logo) as string}
                            alt={s.name}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain"
                          />
                        )}
                      </div>
                    );
                    return s.website ? (
                      <a
                        key={`${s.id}-${j}`}
                        href={s.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={s.name}
                      >
                        {card}
                      </a>
                    ) : (
                      <div key={`${s.id}-${j}`} title={s.name}>
                        {card}
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </Section>
  );
}

export function Live() {
  return (
    <Section id="live">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="relative flex aspect-video items-center justify-center bg-black lg:aspect-auto">
            <div
              className="absolute inset-0 opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            />
            <div className="relative z-10 text-center text-white">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <Radio className="h-9 w-9" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em]">
                Próximamente en vivo
              </p>
            </div>
          </div>
          <div className="p-8 lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive">
              <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> LIVE
            </span>
            <h3 className="mt-4 text-3xl font-bold italic text-primary sm:text-4xl">
              Transmisión en vivo
            </h3>
            <p className="mt-3 text-muted-foreground">
              Sigue las conferencias, paneles y la inauguración cultural en directo desde cualquier
              lugar. Activamos el streaming durante los tres días del evento.
            </p>
            <a
              href="https://www.instagram.com/feria_muchik/reels/?__d=1%2B"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              Llevame al Live <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function Prensa() {
  return (
    <Section id="prensa" className="border-t border-border/60">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Newspaper className="h-8 w-8 text-secondary" />
          <h2 className="mt-4 text-4xl font-bold italic tracking-tight text-primary sm:text-5xl">
            Sala de prensa
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Acreditación de medios, kit de prensa, fotografías oficiales y comunicados. Solicita tu
            credencial para cubrir Muchik 2026.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <RegistroDialog
              className="rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              Solicitar acreditación
            </RegistroDialog>
            <a
              href="#"
              className="rounded-full border border-primary/20 px-6 py-3 text-sm font-semibold text-primary"
            >
              Descargar kit de prensa
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["+380 reuniones B2B", "+200 empresas", "92% satisfacción", "88% expositores"].map(
            (stat, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <p className="text-2xl font-bold italic text-secondary">{stat.split(" ")[0]}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.split(" ").slice(1).join(" ")}
                </p>
              </div>
            ),
          )}
        </div>
      </div>
    </Section>
  );
}

export function Footer() {
  const [cfg, setCfg] = useState<EventConfig | null>(null);

  useEffect(() => {
    let active = true;
    getPublicEventConfig()
      .then((data) => active && setCfg(data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Valores de respaldo mientras carga (o si falla la red).
  const whatsapp1 = cfg?.contact_whatsapp_primary || "+51 931 388 602";
  const whatsapp2 = cfg?.contact_whatsapp_secondary || "+51 993 289 550";
  const email = cfg?.contact_email || "camaradeturismolalibertad@gmail.com";
  const address =
    cfg?.contact_address || "Jr. Independencia 467 · Plaza de Armas (2do piso), Trujillo";

  return (
    <footer id="contacto" className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-3xl font-bold italic">MUCHIK</p>
          <p className="mt-2 text-sm text-white/80">
            Feria Internacional de Turismo · Trujillo, Perú · 2026
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">WhatsApp</p>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4" />
            <span>{whatsapp1}</span>
          </p>
          {whatsapp2 && (
            <p className="mt-1 flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              <span>{whatsapp2}</span>
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">E-mail</p>
          <p className="mt-2 flex items-center gap-2 text-sm break-all">
            <Mail className="h-4 w-4" />
            <span>{email}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Ubicación</p>
          <p className="mt-2 flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4" />
            <span>{address}</span>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-white/60">
        <span className="font-semibold text-white/80">Desarrollado por Inteligencia Natural</span>.
        Reservados todos los derechos
      </div>
    </footer>
  );
}
