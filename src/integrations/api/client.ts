// Cliente REST para el backend Django (congreso-connect-backend).
// Distinto de Supabase: el backend usa su propia autenticación JWT
// (SimpleJWT) bajo /api/v1/. La URL base se configura con VITE_API_URL.

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "cc_access_token";
const REFRESH_TOKEN_KEY = "cc_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

/** Recolecta solo los textos de una respuesta de error (evita "[object Object]"). */
function collectStrings(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(collectStrings).filter(Boolean).join(" ");
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    return Object.values(obj).map(collectStrings).filter(Boolean).join(" · ");
  }
  return "";
}

/** Devuelve un mensaje legible a partir de un error de la API. */
export function readableApiError(
  err: unknown,
  fallback = "Ocurrió un error. Intenta nuevamente.",
): string {
  if (err instanceof ApiError) {
    return collectStrings(err.data) || err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Llama al backend Django. Serializa/deserializa JSON, adjunta el token
 * de acceso cuando `auth` es true y lanza `ApiError` en respuestas no-OK.
 */
export async function apiRequest<T = unknown>(
  path: string,
  { body, auth = false, headers, ...init }: ApiRequestOptions = {},
): Promise<T> {
  const finalHeaders = new Headers(headers);

  // FormData (subida de archivos) se envía tal cual: el navegador fija el
  // Content-Type con el boundary correcto. JSON se serializa.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  const isJson = response.headers.get("Content-Type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (isJson && (data?.detail || data?.message)) || `Error ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}
