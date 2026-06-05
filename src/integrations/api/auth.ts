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

/** Devuelve el usuario autenticado actual usando el access token guardado. */
export async function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/v1/auth/me/", { auth: true });
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
