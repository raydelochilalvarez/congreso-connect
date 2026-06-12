// Patrocinadores (Sponsor) contra el backend Django.
// Lectura pública para la landing + CRUD admin (autorización en el backend).

import { apiRequest } from "./client";
import type { Paginated } from "./ticket-types";

/** Lo que ve la landing (lectura pública). Es solo el avatar (logo). */
export interface PublicSponsor {
  id: number;
  name: string;
  logo: string | null;
}

/** Registro completo para la gestión del admin. */
export interface Sponsor extends PublicSponsor {
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---- Público (landing) ----
export async function listPublicSponsors(): Promise<PublicSponsor[]> {
  return apiRequest<PublicSponsor[]>("/api/v1/public/sponsors/");
}

// ---- Admin ---- (FormData porque incluye el logo)
export async function listSponsors(): Promise<Paginated<Sponsor>> {
  return apiRequest<Paginated<Sponsor>>("/api/v1/sponsors/", { auth: true });
}

export async function createSponsor(data: FormData): Promise<Sponsor> {
  return apiRequest<Sponsor>("/api/v1/sponsors/", { method: "POST", auth: true, body: data });
}

export async function updateSponsor(id: number, data: FormData): Promise<Sponsor> {
  return apiRequest<Sponsor>(`/api/v1/sponsors/${id}/`, {
    method: "PATCH",
    auth: true,
    body: data,
  });
}

export async function deleteSponsor(id: number): Promise<void> {
  await apiRequest(`/api/v1/sponsors/${id}/`, { method: "DELETE", auth: true });
}
