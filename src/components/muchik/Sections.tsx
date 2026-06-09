import { useEffect, useState } from "react";
import { Calendar, MapPin, Ticket, Store, Users, Mic, Radio, Newspaper, Award, Mail, Phone, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SectionTitle, ArrowBand } from "./SectionTitle";
import { RegistroDialog } from "./RegistroDialog";
import { sponsorLogos } from "./sponsor-logos";
import {
  listPublicTicketTypes,
  formatPrice,
  type PublicTicketType,
} from "@/integrations/api/ticket-types";

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

export function Ubicacion() {
  return (
    <Section id="ubicacion">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-secondary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            Sede & Fecha
          </span>
          <h2 className="mt-4 text-4xl font-bold italic tracking-tight text-primary sm:text-5xl">
            Trujillo, Perú
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Nueva sede premium 5★ · Costa del Sol Wyndham Trujillo. Un espacio
            ideal para reuniones estratégicas, networking y experiencias culturales.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card icon={<Calendar className="h-5 w-5" />} title="Fechas" body="21, 22 y 23 de octubre 2026" />
            <Card icon={<MapPin className="h-5 w-5" />} title="Sede" body="Costa del Sol Wyndham · Trujillo" />
            <Card icon={<Award className="h-5 w-5" />} title="País invitado" body="Chile" />
            <Card icon={<Users className="h-5 w-5" />} title="Edición 2025" body="+200 empresas · +380 reuniones B2B" />
          </div>
        </div>
        <div className="relative">
          <div
            className="absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
            style={{ background: "var(--gradient-brand)" }}
          />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-1 shadow-[var(--shadow-brand)]">
            <iframe
              title="Trujillo, Perú"
              src="https://www.google.com/maps?q=Costa+del+Sol+Wyndham+Trujillo&output=embed"
              className="h-[420px] w-full rounded-2xl"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Costa+del+Sol+Wyndham+Trujillo&destination_place_id=&travelmode=driving"
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
  const [tiers, setTiers] = useState<PublicTicketType[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Section id="entradas" className="border-t border-border/60">
      <SectionTitle eyebrow="Público general" title="Entradas" description="Vive Muchik 2026. Elige tu experiencia y asegura tu lugar." />
      {loading ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">Cargando entradas…</div>
      ) : tiers.length === 0 ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Las entradas estarán disponibles muy pronto.
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.id}
              className={`relative rounded-2xl border p-7 transition ${
                t.is_popular
                  ? "border-secondary bg-card shadow-[var(--shadow-brand)]"
                  : "border-border bg-card hover:border-secondary/40"
              }`}
            >
              {t.is_popular && (
                <span className="absolute -top-3 left-7 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Más elegida
                </span>
              )}
              <Ticket className="h-7 w-7 text-secondary" />
              <h3 className="mt-4 text-2xl font-bold italic text-primary">{t.name}</h3>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {formatPrice(t.price, t.currency)}
              </p>
              {t.description && (
                <p className="mt-3 text-sm text-muted-foreground">{t.description}</p>
              )}
              <RegistroDialog
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-brand)" }}
              >
                Comprar entrada <ArrowRight className="h-4 w-4" />
              </RegistroDialog>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export function Stand() {
  return (
    <Section id="stand">
      <ArrowBand>Stands · Exhibición Comercial</ArrowBand>
      <div className="grid gap-6 md:grid-cols-2">
        {[
          { size: "6 m²", dim: "3m × 2m × 2.5m altura", price: "US$ 1,500 + IGV" },
          { size: "16 m²", dim: "4m × 4m × 2.5m altura", price: "US$ 3,500 + IGV" },
        ].map((s) => (
          <div key={s.size} className="relative overflow-hidden rounded-2xl border border-border bg-card p-7">
            <Store className="h-8 w-8 text-secondary" />
            <h3 className="mt-3 text-3xl font-bold italic text-primary">Stand {s.size}</h3>
            <p className="mt-1 text-muted-foreground">{s.dim}</p>
            <p className="mt-4 text-2xl font-bold text-foreground">{s.price}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>· Mesa, sillas, friso institucional</li>
              <li>· WiFi, mantelería, tomacorrientes</li>
              <li>· Personal de logística</li>
              <li>· Cóctel de inauguración</li>
            </ul>
            <RegistroDialog className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5">
              Reservar stand <ArrowRight className="h-4 w-4" />
            </RegistroDialog>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function RuedaNegocios() {
  const agenda = [
    { day: "Día 1 · 21 Oct", title: "Inauguración + Rueda B2B mañana", time: "09:00 — 13:00" },
    { day: "Día 2 · 22 Oct", title: "Rueda B2B full-day + Foro Internacional", time: "09:00 — 18:00" },
    { day: "Día 3 · 23 Oct", title: "Cierre B2B + Networking", time: "09:00 — 14:00" },
  ];
  return (
    <Section id="rueda" className="border-t border-border/60">
      <SectionTitle
        eyebrow="B2B"
        title="Rueda de Negocios"
        description="Mesas exclusivas para reuniones estratégicas y alianzas comerciales con compradores nacionales e internacionales."
      />
      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl p-7 text-primary-foreground shadow-[var(--shadow-brand)]" style={{ background: "var(--gradient-brand)" }}>
          <Users className="h-8 w-8" />
          <h3 className="mt-4 text-3xl font-bold italic">Inscripción B2B</h3>
          <p className="mt-2 text-white/90">Precio regular</p>
          <p className="mt-1 text-5xl font-bold">S/ 1,500</p>
          <p className="text-sm text-white/80">incluido IGV</p>
          <p className="mt-5 text-sm text-white/90">
            Incluye: table tent, dos sillas, WiFi, mantelería, conexión laptops, personal de logística.
          </p>
          <RegistroDialog className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary">
            Registrarme a la rueda <ArrowRight className="h-4 w-4" />
          </RegistroDialog>
        </div>
        <div className="rounded-2xl border border-border bg-card p-7">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-secondary">Agenda</h4>
          <ul className="mt-4 divide-y divide-border">
            {agenda.map((a) => (
              <li key={a.day} className="flex items-start gap-4 py-4">
                <div className="w-32 shrink-0 text-xs font-bold uppercase tracking-wider text-primary">{a.day}</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function Conferencia() {
  const speakers = [
    {
      name: "María Fernández",
      role: "Mintur Chile · País invitado",
      initials: "MF",
      position: "Directora de Promoción Internacional · Subsecretaría de Turismo de Chile",
      bio: "Más de 15 años liderando estrategias de promoción turística para Chile en mercados de Latinoamérica, Europa y Asia. Ha sido clave en el posicionamiento de la marca país y en alianzas con operadores internacionales para diversificar la oferta cultural y de naturaleza.",
      topic: "Chile como país invitado: oportunidades de integración turística con el norte del Perú.",
    },
    {
      name: "Carlos Quispe",
      role: "CANATUR · Cámara Nac. de Turismo",
      initials: "CQ",
      position: "Vicepresidente · Cámara Nacional de Turismo del Perú (CANATUR)",
      bio: "Empresario hotelero con tres décadas de experiencia en el sector. Ha impulsado políticas público-privadas para el desarrollo del turismo receptivo y la formalización de pymes turísticas a nivel nacional.",
      topic: "Hoja de ruta del turismo peruano 2026-2030: inversión, conectividad y sostenibilidad.",
    },
    {
      name: "Lucía Vargas",
      role: "Promperú · Estrategia Norte",
      initials: "LV",
      position: "Gerente Regional Norte · PROMPERÚ",
      bio: "Especialista en marketing turístico y desarrollo de destinos. Lidera la estrategia macrorregional del norte peruano, articulando a La Libertad, Lambayeque, Piura y Tumbes en una propuesta integrada de cultura Muchik, gastronomía y playas.",
      topic: "Marca Norte: cómo construir un destino competitivo desde la identidad Muchik.",
    },
    {
      name: "Andrés Soto",
      role: "Costa del Sol Wyndham",
      initials: "AS",
      position: "Director Comercial · Costa del Sol Wyndham Hoteles",
      bio: "Ejecutivo con amplia trayectoria en hotelería 5★ y MICE en el Perú. Ha desarrollado productos premium para turismo corporativo, eventos y experiencias culturales en la macrorregión norte.",
      topic: "Turismo MICE en Trujillo: infraestructura, servicios y experiencias para el viajero corporativo.",
    },
  ];
  return (
    <Section id="conferencia">
      <ArrowBand>Foro Internacional Muchik</ArrowBand>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Mic className="h-8 w-8 text-secondary" />
          <h3 className="mt-4 text-3xl font-bold italic text-primary">Disertantes</h3>
          <p className="mt-2 text-muted-foreground">
            Expertos, autoridades y profesionales analizan nuevas estrategias para diversificar la oferta turística del Perú.
          </p>
          <RegistroDialog
            className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            Reservar mi cupo <ArrowRight className="h-4 w-4" />
          </RegistroDialog>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {speakers.map((s) => (
            <Dialog key={s.name}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-5 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-secondary/40 hover:shadow-md"
                >
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-xl font-bold italic text-white"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {s.initials}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.role}</p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold italic text-white"
                      style={{ background: "var(--gradient-brand)" }}
                    >
                      {s.initials}
                    </div>
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
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Cargo</p>
                    <p className="mt-1 text-sm text-foreground">{s.position}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Biografía</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.bio}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Tema en el Foro</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.topic}</p>
                  </div>
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
      </div>
    </Section>
  );
}

export function Patrocinios() {
  return (
    <Section id="patrocinios" className="border-t border-border/60">
      <SectionTitle eyebrow="Aliados" title="Patrocinios" description="Marcas, gremios e instituciones que hacen posible Muchik." />
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {sponsorLogos.map((src) => (
          <div
            key={src}
            className="flex h-28 items-center justify-center rounded-xl border border-border bg-white p-3 transition hover:border-secondary/40 hover:shadow-md"
          >
            <img
              src={src}
              alt="Logo patrocinador"
              loading="lazy"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Live() {
  return (
    <Section id="live">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="relative flex aspect-video items-center justify-center bg-black lg:aspect-auto">
            <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-brand)" }} />
            <div className="relative z-10 text-center text-white">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <Radio className="h-9 w-9" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em]">Próximamente en vivo</p>
            </div>
          </div>
          <div className="p-8 lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive">
              <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> LIVE
            </span>
            <h3 className="mt-4 text-3xl font-bold italic text-primary sm:text-4xl">Transmisión en vivo</h3>
            <p className="mt-3 text-muted-foreground">
              Sigue las conferencias, paneles y la inauguración cultural en directo
              desde cualquier lugar. Activamos el streaming durante los tres días del evento.
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
          <h2 className="mt-4 text-4xl font-bold italic tracking-tight text-primary sm:text-5xl">Sala de prensa</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Acreditación de medios, kit de prensa, fotografías oficiales y comunicados.
            Solicita tu credencial para cubrir Muchik 2026.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <RegistroDialog
              className="rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              Solicitar acreditación
            </RegistroDialog>
            <a href="#" className="rounded-full border border-primary/20 px-6 py-3 text-sm font-semibold text-primary">
              Descargar kit de prensa
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            "+380 reuniones B2B",
            "+200 empresas",
            "92% satisfacción",
            "88% expositores",
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-2xl font-bold italic text-secondary">{stat.split(" ")[0]}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.split(" ").slice(1).join(" ")}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function Footer() {
  return (
    <footer id="contacto" className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-3xl font-bold italic">MUCHIK</p>
          <p className="mt-2 text-sm text-white/80">Feria Internacional de Turismo · Trujillo, Perú · 2026</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">WhatsApp</p>
          <p className="mt-2 flex items-center gap-2 text-sm"><Phone className="h-4 w-4" /><span>+51 931 388 602</span></p>
          <p className="mt-1 flex items-center gap-2 text-sm"><Phone className="h-4 w-4" /><span>+51 993 289 550</span></p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">E-mail</p>
          <p className="mt-2 flex items-center gap-2 text-sm break-all"><Mail className="h-4 w-4" /><span>camaradeturismolalibertad@gmail.com</span></p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Ubicación</p>
          <p className="mt-2 flex items-start gap-2 text-sm"><MapPin className="h-4 w-4 mt-0.5" /><span>Jr. Independencia 467 · Plaza de Armas (2do piso), Trujillo</span></p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">
        © 2026 Muchik · Cámara de Turismo de La Libertad. Todos los derechos reservados.
      </div>
    </footer>
  );
}