// Autenticación contra el backend Django (SimpleJWT).
// Endpoints: /api/v1/auth/{login,refresh,logout,me}/

import { apiRequest, clearTokens, getRefreshToken, setTokens } from "./client";

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  /** Estado del expositor: "pending" | "approved" | "rejected", o null si no es expositor. */
  expositor_status: string | null;
  avatar: string | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

/**
 * Inicia sesión con email y contraseña. Persiste los tokens JWT y
 * devuelve los datos del usuario.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiRequest<LoginResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: { email, password },
  });
  setTokens(data.access, data.refresh);
  return data.user;
}

export interface RegisterAsistenteInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface RegisterExpositorInput extends RegisterAsistenteInput {
  razon_social: string;
  ruc: string;
}

/**
 * Registra un ASISTENTE/comprador. El backend fuerza el rol 'user' y devuelve
 * tokens (auto-login); aquí los persistimos y retornamos el usuario.
 */
export async function registerAsistente(input: RegisterAsistenteInput): Promise<AuthUser> {
  const data = await apiRequest<LoginResponse>("/api/v1/auth/register/asistente/", {
    method: "POST",
    body: input,
  });
  setTokens(data.access, data.refresh);
  return data.user;
}

/**
 * Registra un EXPOSITOR. El backend crea la cuenta (rol 'expositor') en estado
 * pendiente de aprobación y devuelve tokens (auto-login).
 */
export async function registerExpositor(input: RegisterExpositorInput): Promise<AuthUser> {
  const data = await apiRequest<LoginResponse>("/api/v1/auth/register/expositor/", {
    method: "POST",
    body: input,
  });
  setTokens(data.access, data.refresh);
  return data.user;
}

/** Devuelve el usuario autenticado actual usando el access token guardado. */
export async function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/v1/auth/me/", { auth: true });
}

/** Iniciales para el avatar: primera letra de nombre + apellido (fallback a email). */
export function userInitials(user: Pick<AuthUser, "first_name" | "last_name" | "full_name" | "email">): string {
  const a = (user.first_name || "").trim().charAt(0);
  const b = (user.last_name || "").trim().charAt(0);
  const initials = `${a}${b}`.toUpperCase();
  if (initials) return initials;
  const full = (user.full_name || "").trim().charAt(0);
  return (full || user.email.charAt(0) || "?").toUpperCase();
}

/** Cierra la sesión: invalida el refresh token en el backend y limpia el storage. */
export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiRequest("/api/v1/auth/logout/", {
        method: "POST",
        auth: true,
        body: { refresh },
      });
    }
  } finally {
    clearTokens();
  }
}
