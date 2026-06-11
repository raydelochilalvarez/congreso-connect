// Banners del carrusel principal (Banner) contra el backend Django.
// Lectura pública para la landing + CRUD admin (autorización en el backend).

import { apiRequest } from "./client";
import type { Paginated } from "./ticket-types";

/** Lo que ve la landing (lectura pública). */
export interface PublicBanner {
  id: number;
  image: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
}

/** Registro completo para la gestión del admin. */
export interface Banner extends PublicBanner {
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---- Público (landing) ----
export async function listPublicBanners(): Promise<PublicBanner[]> {
  return apiRequest<PublicBanner[]>("/api/v1/public/banners/");
}

// ---- Admin ---- (FormData porque incluye la imagen)
export async function listBanners(): Promise<Paginated<Banner>> {
  return apiRequest<Paginated<Banner>>("/api/v1/banners/", { auth: true });
}

export async function createBanner(data: FormData): Promise<Banner> {
  return apiRequest<Banner>("/api/v1/banners/", { method: "POST", auth: true, body: data });
}

export async function updateBanner(id: number, data: FormData): Promise<Banner> {
  return apiRequest<Banner>(`/api/v1/banners/${id}/`, { method: "PATCH", auth: true, body: data });
}

export async function deleteBanner(id: number): Promise<void> {
  await apiRequest(`/api/v1/banners/${id}/`, { method: "DELETE", auth: true });
}
