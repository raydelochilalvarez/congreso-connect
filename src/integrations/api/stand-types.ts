// Tipos de stand (StandType) contra el backend Django.
// Lectura pública para la landing + CRUD admin (autorización en el backend).

import { apiRequest } from "./client";
import type { Currency, Paginated } from "./ticket-types";

/** Lo que ve la landing (lectura pública). */
export interface PublicStandType {
  id: number;
  name: string;
  dimensions: string;
  price: string;
  currency: Currency;
  price_plus_igv: boolean;
  includes: string; // un ítem por línea
}

/** Registro completo para la gestión del admin. */
export interface StandType extends PublicStandType {
  currency_display: string;
  is_active: boolean;
  capacity: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StandTypeInput {
  name: string;
  dimensions?: string;
  price: string | number;
  currency: Currency;
  price_plus_igv?: boolean;
  includes?: string;
  capacity?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

/** Divide el campo "includes" (multilínea) en viñetas. */
export function splitIncludes(includes: string): string[] {
  return includes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// ---- Público (landing) ----
export async function listPublicStandTypes(): Promise<PublicStandType[]> {
  return apiRequest<PublicStandType[]>("/api/v1/public/stand-types/");
}

// ---- Admin ----
export async function listStandTypes(): Promise<Paginated<StandType>> {
  return apiRequest<Paginated<StandType>>("/api/v1/stand-types/", { auth: true });
}

export async function createStandType(data: StandTypeInput): Promise<StandType> {
  return apiRequest<StandType>("/api/v1/stand-types/", {
    method: "POST",
    auth: true,
    body: data,
  });
}

export async function updateStandType(
  id: number,
  data: Partial<StandTypeInput>,
): Promise<StandType> {
  return apiRequest<StandType>(`/api/v1/stand-types/${id}/`, {
    method: "PATCH",
    auth: true,
    body: data,
  });
}

export async function deleteStandType(id: number): Promise<void> {
  await apiRequest(`/api/v1/stand-types/${id}/`, { method: "DELETE", auth: true });
}
