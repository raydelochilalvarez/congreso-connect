// Configuración del evento (singleton) contra el backend Django.
// Lectura pública para la landing + lectura/edición admin.

import { apiRequest } from "./client";

export interface EventConfig {
  location_headline: string;
  location_description: string;
  dates: string;
  venue: string;
  guest_country: string;
  previous_edition_label: string;
  previous_edition_stats: string;
  map_query: string;
  contact_whatsapp_primary: string;
  contact_whatsapp_secondary: string;
  contact_email: string;
  contact_address: string;
}

/** URL del mapa embebido de Google a partir del texto de búsqueda. */
export function mapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/** URL de "Cómo llegar" (direcciones) de Google. */
export function mapDirectionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`;
}

// ---- Público (landing) ----
export async function getPublicEventConfig(): Promise<EventConfig> {
  return apiRequest<EventConfig>("/api/v1/public/event-config/");
}

// ---- Admin ----
export async function getEventConfig(): Promise<EventConfig> {
  return apiRequest<EventConfig>("/api/v1/admin/event-config/", { auth: true });
}

export async function updateEventConfig(data: Partial<EventConfig>): Promise<EventConfig> {
  return apiRequest<EventConfig>("/api/v1/admin/event-config/", {
    method: "PATCH",
    auth: true,
    body: data,
  });
}
