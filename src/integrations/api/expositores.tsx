// Gestión de expositores (solo admin) contra el backend Django.
// Endpoints bajo /api/v1/expositores/ — la autorización se exige en el backend.

import { apiRequest } from "./client";
import type { AuthUser } from "./auth";

export type ExpositorStatus = "pending" | "approved" | "rejected";

export interface ExpositorAdmin {
  id: number;
  razon_social: string;
  ruc: string;
  approval_status: ExpositorStatus;
  approval_status_display: string;
  /** Datos del usuario dueño del perfil (UserMinimalSerializer). */
  user: AuthUser;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Lista expositores, opcionalmente filtrados por estado de aprobación. */
export async function listExpositores(
  status?: ExpositorStatus,
): Promise<Paginated<ExpositorAdmin>> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<Paginated<ExpositorAdmin>>(`/api/v1/expositores/${qs}`, {
    auth: true,
  });
}

/** Aprueba un expositor (admin). Devuelve el perfil actualizado. */
export async function approveExpositor(id: number): Promise<ExpositorAdmin> {
  return apiRequest<ExpositorAdmin>(`/api/v1/expositores/${id}/approve/`, {
    method: "POST",
    auth: true,
  });
}

/** Rechaza un expositor (admin). Devuelve el perfil actualizado. */
export async function rejectExpositor(id: number): Promise<ExpositorAdmin> {
  return apiRequest<ExpositorAdmin>(`/api/v1/expositores/${id}/reject/`, {
    method: "POST",
    auth: true,
  });
}
