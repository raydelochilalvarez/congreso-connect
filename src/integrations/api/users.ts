// Gestión de usuarios contra el backend Django (solo-admin).
// Por ahora se usa para crear y listar "registradores": el rol que escanea el
// QR de las entradas. El endpoint /api/v1/users/ ya valida admin en el backend.

import { apiRequest } from "./client";
import type { Paginated } from "./ticket-types";

/** Usuario tal como lo lee el admin (UserSerializer). */
export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  phone: string;
  is_active: boolean;
  avatar: string | null;
  date_joined: string;
  last_login: string | null;
}

export interface CreateUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: string;
}

/** Lista los usuarios con rol registrador (más recientes primero). */
export async function listRegistradores(): Promise<Paginated<AdminUser>> {
  return apiRequest<Paginated<AdminUser>>(
    "/api/v1/users/?role=registrador&ordering=-date_joined",
    { auth: true },
  );
}

/** Crea un usuario (admin). Para un registrador, pasar role: "registrador". */
export async function createUser(data: CreateUserPayload): Promise<AdminUser> {
  return apiRequest<AdminUser>("/api/v1/users/", {
    method: "POST",
    auth: true,
    body: data,
  });
}
