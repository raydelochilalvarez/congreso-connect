// Órdenes (compra de entradas) contra el backend Django.
// Compra y "mis órdenes" para el usuario; gestión para el admin.

import { apiRequest } from "./client";
import type { AuthUser } from "./auth";
import type { Currency, Paginated } from "./ticket-types";

export type OrderStatus = "pending" | "paid" | "cancelled";

export interface Order {
  id: number;
  ticket_type_name: string;
  unit_price: string;
  currency: Currency;
  quantity: number;
  total_amount: string;
  status: OrderStatus;
  status_display: string;
  paid_at: string | null;
  created_at: string;
}

/** Igual que Order pero con los datos del comprador (vista admin). */
export interface AdminOrder extends Order {
  user: AuthUser;
}

// ---- Usuario ----
/** Compra: el servidor calcula precio y valida cupo. Crea una orden pendiente. */
export async function createOrder(ticketTypeId: number, quantity = 1): Promise<Order> {
  return apiRequest<Order>("/api/v1/orders/", {
    method: "POST",
    auth: true,
    body: { ticket_type_id: ticketTypeId, quantity },
  });
}

export async function listMyOrders(): Promise<Paginated<Order>> {
  return apiRequest<Paginated<Order>>("/api/v1/orders/", { auth: true });
}

// ---- Admin ----
export async function listAllOrders(status?: OrderStatus): Promise<Paginated<AdminOrder>> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<Paginated<AdminOrder>>(`/api/v1/admin/orders/${qs}`, { auth: true });
}

/** Marca pagada (simula la pasarela por ahora). */
export async function markOrderPaid(id: number): Promise<AdminOrder> {
  return apiRequest<AdminOrder>(`/api/v1/admin/orders/${id}/mark-paid/`, {
    method: "POST",
    auth: true,
  });
}

export async function cancelOrder(id: number): Promise<AdminOrder> {
  return apiRequest<AdminOrder>(`/api/v1/admin/orders/${id}/cancel/`, {
    method: "POST",
    auth: true,
  });
}
