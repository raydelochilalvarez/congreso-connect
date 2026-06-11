// Sección Rueda de Negocios B2B contra el backend Django.
// Config singleton (textos + tarjeta de inscripción) + agenda (lista).

import { apiRequest } from "./client";
import type { Paginated } from "./ticket-types";

export interface B2BConfig {
  eyebrow: string;
  title: string;
  description: string;
  card_title: string;
  price_label: string;
  price: string;
  price_note: string;
  includes_text: string;
  cta_label: string;
}

/** Lo que ve la landing de una fila de agenda. */
export interface PublicB2BAgendaItem {
  id: number;
  day_label: string;
  title: string;
  time_range: string;
}

/** Registro completo de agenda para la gestión del admin. */
export interface B2BAgendaItem extends PublicB2BAgendaItem {
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---- Público (landing) ----
export async function getPublicB2BConfig(): Promise<B2BConfig> {
  return apiRequest<B2BConfig>("/api/v1/public/b2b-config/");
}

export async function listPublicB2BAgenda(): Promise<PublicB2BAgendaItem[]> {
  return apiRequest<PublicB2BAgendaItem[]>("/api/v1/public/b2b-agenda/");
}

// ---- Admin: config (singleton) ----
export async function getB2BConfig(): Promise<B2BConfig> {
  return apiRequest<B2BConfig>("/api/v1/admin/b2b-config/", { auth: true });
}

export async function updateB2BConfig(data: Partial<B2BConfig>): Promise<B2BConfig> {
  return apiRequest<B2BConfig>("/api/v1/admin/b2b-config/", {
    method: "PATCH",
    auth: true,
    body: data,
  });
}

// ---- Admin: agenda (CRUD) ----
export async function listB2BAgenda(): Promise<Paginated<B2BAgendaItem>> {
  return apiRequest<Paginated<B2BAgendaItem>>("/api/v1/b2b-agenda/", { auth: true });
}

export async function createB2BAgendaItem(data: Partial<B2BAgendaItem>): Promise<B2BAgendaItem> {
  return apiRequest<B2BAgendaItem>("/api/v1/b2b-agenda/", {
    method: "POST",
    auth: true,
    body: data,
  });
}

export async function updateB2BAgendaItem(
  id: number,
  data: Partial<B2BAgendaItem>,
): Promise<B2BAgendaItem> {
  return apiRequest<B2BAgendaItem>(`/api/v1/b2b-agenda/${id}/`, {
    method: "PATCH",
    auth: true,
    body: data,
  });
}

export async function deleteB2BAgendaItem(id: number): Promise<void> {
  await apiRequest(`/api/v1/b2b-agenda/${id}/`, { method: "DELETE", auth: true });
}
