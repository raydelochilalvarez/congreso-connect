// Tipos de entrada (TicketType) contra el backend Django.
// Lectura pública para la landing + CRUD admin (la autorización se exige en el backend).

import { apiRequest } from "./client";

export type Currency = "PEN" | "USD";

/** Lo que ve la landing (lectura pública). */
export interface PublicTicketType {
  id: number;
  name: string;
  description: string;
  price: string; // DRF serializa Decimal como string
  currency: Currency;
  is_popular: boolean;
}

/** Registro completo para la gestión del admin. */
export interface TicketType extends PublicTicketType {
  currency_display: string;
  is_active: boolean;
  capacity: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TicketTypeInput {
  name: string;
  description?: string;
  price: string | number;
  currency: Currency;
  is_popular?: boolean;
  is_active?: boolean;
  capacity?: number | null;
  sort_order?: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const CURRENCY_SYMBOLS: Record<Currency, string> = { PEN: "S/", USD: "US$" };

/** Moneda peruana primero, como pidió el usuario. */
export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "PEN", label: "Sol peruano (S/)" },
  { value: "USD", label: "Dólar (US$)" },
];

/** Formatea "120.00" + "PEN" → "S/ 120". */
export function formatPrice(price: string | number, currency: Currency): string {
  const n = typeof price === "number" ? price : Number(price);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  if (!Number.isFinite(n)) return `${symbol} ${price}`;
  const formatted = n.toLocaleString("es-PE", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}

// ---- Público (landing) — sin paginación, arreglo plano ----
export async function listPublicTicketTypes(): Promise<PublicTicketType[]> {
  return apiRequest<PublicTicketType[]>("/api/v1/public/ticket-types/");
}

// ---- Admin ----
export async function listTicketTypes(): Promise<Paginated<TicketType>> {
  return apiRequest<Paginated<TicketType>>("/api/v1/ticket-types/", { auth: true });
}

export async function createTicketType(data: TicketTypeInput): Promise<TicketType> {
  return apiRequest<TicketType>("/api/v1/ticket-types/", {
    method: "POST",
    auth: true,
    body: data,
  });
}

export async function updateTicketType(
  id: number,
  data: Partial<TicketTypeInput>,
): Promise<TicketType> {
  return apiRequest<TicketType>(`/api/v1/ticket-types/${id}/`, {
    method: "PATCH",
    auth: true,
    body: data,
  });
}

export async function deleteTicketType(id: number): Promise<void> {
  await apiRequest(`/api/v1/ticket-types/${id}/`, { method: "DELETE", auth: true });
}
