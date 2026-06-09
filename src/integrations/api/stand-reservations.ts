// Reservas de stand contra el backend Django.
// Reservar y "mis reservas" para el expositor; gestión para el admin.

import { apiRequest } from "./client";
import type { AuthUser } from "./auth";
import type { Currency, Paginated } from "./ticket-types";

export type ReservationStatus = "pending" | "paid" | "cancelled";

export interface StandReservation {
  id: number;
  stand_type_name: string;
  unit_price: string;
  currency: Currency;
  quantity: number;
  total_amount: string;
  status: ReservationStatus;
  status_display: string;
  paid_at: string | null;
  created_at: string;
}

/** Igual que StandReservation pero con los datos del expositor (vista admin). */
export interface AdminStandReservation extends StandReservation {
  user: AuthUser;
}

// ---- Expositor ----
/** Reserva: solo expositor aprobado. El servidor calcula precio y valida cupo. */
export async function createReservation(
  standTypeId: number,
  quantity = 1,
): Promise<StandReservation> {
  return apiRequest<StandReservation>("/api/v1/stand-reservations/", {
    method: "POST",
    auth: true,
    body: { stand_type_id: standTypeId, quantity },
  });
}

export async function listMyReservations(): Promise<Paginated<StandReservation>> {
  return apiRequest<Paginated<StandReservation>>("/api/v1/stand-reservations/", { auth: true });
}

// ---- Admin ----
export async function listAllReservations(
  status?: ReservationStatus,
): Promise<Paginated<AdminStandReservation>> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<Paginated<AdminStandReservation>>(`/api/v1/admin/stand-reservations/${qs}`, {
    auth: true,
  });
}

export async function markReservationPaid(id: number): Promise<AdminStandReservation> {
  return apiRequest<AdminStandReservation>(`/api/v1/admin/stand-reservations/${id}/mark-paid/`, {
    method: "POST",
    auth: true,
  });
}

export async function cancelReservation(id: number): Promise<AdminStandReservation> {
  return apiRequest<AdminStandReservation>(`/api/v1/admin/stand-reservations/${id}/cancel/`, {
    method: "POST",
    auth: true,
  });
}
