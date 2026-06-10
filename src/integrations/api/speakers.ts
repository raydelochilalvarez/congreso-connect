// Disertantes (Speaker) contra el backend Django.
// Lectura pública para la landing + CRUD admin (autorización en el backend).

import { apiRequest } from "./client";
import type { Paginated } from "./ticket-types";

/** Lo que ve la landing (lectura pública). */
export interface PublicSpeaker {
  id: number;
  name: string;
  role: string;
  position: string;
  bio: string;
  topic: string;
  photo: string | null;
}

/** Registro completo para la gestión del admin. */
export interface Speaker extends PublicSpeaker {
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Iniciales para el avatar cuando no hay foto. */
export function speakerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.charAt(0) ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (a + b).toUpperCase() || "?";
}

// ---- Público (landing) ----
export async function listPublicSpeakers(): Promise<PublicSpeaker[]> {
  return apiRequest<PublicSpeaker[]>("/api/v1/public/speakers/");
}

// ---- Admin ---- (FormData porque puede incluir la foto)
export async function listSpeakers(): Promise<Paginated<Speaker>> {
  return apiRequest<Paginated<Speaker>>("/api/v1/speakers/", { auth: true });
}

export async function createSpeaker(data: FormData): Promise<Speaker> {
  return apiRequest<Speaker>("/api/v1/speakers/", { method: "POST", auth: true, body: data });
}

export async function updateSpeaker(id: number, data: FormData): Promise<Speaker> {
  return apiRequest<Speaker>(`/api/v1/speakers/${id}/`, { method: "PATCH", auth: true, body: data });
}

export async function deleteSpeaker(id: number): Promise<void> {
  await apiRequest(`/api/v1/speakers/${id}/`, { method: "DELETE", auth: true });
}
