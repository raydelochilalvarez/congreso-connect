import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RegistroDialog } from "./RegistroDialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { mediaUrl } from "@/integrations/api/client";
import { listPublicBanners } from "@/integrations/api/banners";
import banner1 from "@/assets/banner-feria.jpg";
import banner2 from "@/assets/banner-trujillo.jpg";
import banner3 from "@/assets/banner-peru.jpg";

interface Slide {
  img: string;
  eyebrow: string;
  title: string;
  sub: string;
}

// Diapositivas por defecto: se muestran mientras carga y como respaldo si el
// admin aún no ha creado banners (la landing nunca queda vacía).
const fallbackSlides: Slide[] = [
  {
    img: banner1,
    eyebrow: "Feria Internacional de Turismo",
    title: "MUCHIK 2026",
    sub: "El punto donde el turismo se reinventa.",
  },
  {
    img: banner2,
    eyebrow: "Trujillo · Perú",
    title: "Descubre el norte",
    sub: "Tres días de cultura, negocios y conexiones.",
  },
  {
    img: banner3,
    eyebrow: "País Invitado · Chile",
    title: "Latinoamérica unida",
    sub: "Operadores, marcas y destinos en un solo lugar.",
  },
];

export function BannerCarousel() {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const { user, loading } = useCurrentUser();

  // Carga los banners dinámicos del backend; si no hay, deja los de respaldo.
  useEffect(() => {
    let active = true;
    listPublicBanners()
      .then((banners) => {
        if (!active || banners.length === 0) return;
        setSlides(
          banners.map((b) => ({
            img: mediaUrl(b.image) || "",
            eyebrow: b.eyebrow,
            title: b.title,
            sub: b.subtitle,
          })),
        );
      })
      .catch(() => {
        /* error de red → conserva los de respaldo */
      });
    return () => {
      active = false;
    };
  }, []);

  // Reinicia Embla y el autoplay cuando cambian las diapositivas.
  useEffect(() => {
    if (!embla) return;
    embla.reInit();
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    const id = setInterval(() => embla.scrollNext(), 5500);
    return () => {
      clearInterval(id);
      embla.off("select", onSelect);
    };
  }, [embla, slides]);

  return (
    <section id="banner" className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((s, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-[68vh] min-h-[460px] w-full sm:h-[78vh]">
                <img
                  src={s.img}
                  alt={s.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  width={1920}
                  height={1080}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/85 via-primary/40 to-secondary/30 mix-blend-multiply" />
                <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-start justify-end px-6 pb-20 text-primary-foreground lg:px-12 lg:pb-28">
                  <span className="rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] backdrop-blur">
                    {s.eyebrow}
                  </span>
                  <h1 className="mt-5 text-5xl font-bold italic leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
                    {s.title}
                  </h1>
                  <p className="mt-4 max-w-xl text-lg font-light text-white/90 sm:text-xl">
                    {s.sub}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    {!loading && !user && (
                      <RegistroDialog className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-primary shadow-[var(--shadow-brand)] transition hover:scale-[1.02]">
                        Regístrate
                      </RegistroDialog>
                    )}
                    <a
                      href="#entradas"
                      className="rounded-full border border-white/60 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Ver entradas
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        aria-label="Anterior"
        onClick={() => embla?.scrollPrev()}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25 sm:left-6 sm:p-3"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        aria-label="Siguiente"
        onClick={() => embla?.scrollNext()}
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25 sm:right-6 sm:p-3"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => embla?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-8 bg-white" : "w-3 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
