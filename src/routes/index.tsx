import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/muchik/Header";
import { BannerCarousel } from "@/components/muchik/BannerCarousel";
import {
  Ubicacion,
  Entradas,
  Stand,
  RuedaNegocios,
  Conferencia,
  Patrocinios,
  Live,
  Prensa,
  Footer,
} from "@/components/muchik/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muchik 2026 — Feria Internacional de Turismo · Trujillo, Perú" },
      { name: "description", content: "Muchik 2026 — Feria Internacional de Turismo. Trujillo, Perú · 21, 22 y 23 de octubre. Rueda de negocios B2B, foro internacional, stands y experiencias culturales." },
      { property: "og:title", content: "Muchik 2026 — Feria Internacional de Turismo" },
      { property: "og:description", content: "Trujillo, Perú · 21, 22 y 23 de octubre 2026. El punto donde el turismo se reinventa." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div id="top" className="min-h-screen bg-background">
      <Header />
      <main>
        <BannerCarousel />
        <Ubicacion />
        <Entradas />
        <Stand />
        <RuedaNegocios />
        <Conferencia />
        <Patrocinios />
        <Live />
        <Prensa />
      </main>
      <Footer />
    </div>
  );
}
