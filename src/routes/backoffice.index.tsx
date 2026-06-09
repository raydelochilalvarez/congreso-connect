import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/backoffice/")({
  // Por ahora el backoffice abre directo en la gestión de expositores.
  beforeLoad: () => {
    throw redirect({ to: "/backoffice/expositores" });
  },
});
