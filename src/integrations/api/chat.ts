// API del chat 1 a 1 contra el backend Django (/api/v1/chat/).
// REST para historial/contactos + helper de URL para el WebSocket en vivo.

import { apiRequest, getAccessToken } from "./client";

export interface ChatUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  avatar: string | null;
}

export interface ChatMessage {
  id: number;
  conversation: number;
  sender: number;
  body: string;
  /** Presente en respuestas REST; en eventos WS se deduce con `sender`. */
  is_mine?: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  other_user: ChatUser;
  last_message: ChatMessage | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatContact extends ChatUser {
  conversation_id: number | null;
  last_message: ChatMessage | null;
  unread_count: number;
}

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Usuarios con los que puedo chatear (subconjunto habilitado en el backend). */
export async function fetchContacts(search?: string): Promise<ChatContact[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  const data = await apiRequest<Paginated<ChatContact>>(`/api/v1/chat/contacts/${q}`, {
    auth: true,
  });
  return data.results;
}

/** Mi bandeja de conversaciones, ordenada por último mensaje. */
export async function fetchConversations(): Promise<Conversation[]> {
  const data = await apiRequest<Paginated<Conversation>>("/api/v1/chat/conversations/", {
    auth: true,
  });
  return data.results;
}

/**
 * Historial de una conversación. La página 1 trae los mensajes más recientes;
 * devolvemos `results` ya invertidos (orden cronológico ascendente para pintar).
 */
export async function fetchMessages(
  conversationId: number,
  page = 1,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const data = await apiRequest<Paginated<ChatMessage>>(
    `/api/v1/chat/conversations/${conversationId}/messages/?page=${page}`,
    { auth: true },
  );
  return { messages: [...data.results].reverse(), hasMore: Boolean(data.next) };
}

/** Abre (o devuelve) la conversación 1 a 1 con un usuario. */
export async function openConversationWith(userId: number): Promise<Conversation> {
  return apiRequest<Conversation>(`/api/v1/chat/conversations/with/${userId}/`, {
    method: "POST",
    auth: true,
  });
}

/** Marca como leídos los mensajes entrantes de una conversación. */
export async function markConversationRead(conversationId: number): Promise<void> {
  await apiRequest(`/api/v1/chat/conversations/${conversationId}/read/`, {
    method: "POST",
    auth: true,
  });
}

/** Eventos que el servidor empuja por el WebSocket. */
export type ChatSocketEvent =
  | { type: "message"; conversation_id: number; message: ChatMessage }
  | { type: "typing"; conversation_id: number; user_id: number; state: boolean }
  | { type: "read"; conversation_id: number; reader_id: number }
  | { type: "error"; detail: string };

/** Mensajes que el cliente envía por el WebSocket. */
export type ChatSocketCommand =
  | { type: "message.send"; to: number; body: string }
  | { type: "typing"; conversation: number; state: boolean }
  | { type: "read"; conversation: number };

/** Construye la URL del WebSocket (ws/wss) con el token de acceso. */
export function chatSocketUrl(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const wsBase = base.replace(/^http/, "ws"); // http→ws, https→wss
  return `${wsBase}/ws/chat/?token=${encodeURIComponent(token)}`;
}
