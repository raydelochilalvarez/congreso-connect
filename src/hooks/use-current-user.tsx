import { useEffect, useState } from "react";
import { getAccessToken, clearTokens, ApiError } from "@/integrations/api/client";
import {
  getCurrentUser,
  logout as apiLogout,
  type AuthUser,
} from "@/integrations/api/auth";

/**
 * Estado de autenticación para componentes de cliente (p. ej. el Header).
 * En SSR no hay token (localStorage no existe) → arranca en `loading` y se
 * resuelve en el cliente tras montar, evitando desajustes de hidratación.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then((u) => active && setUser(u))
      .catch((err) => {
        if (active) setUser(null);
        // Token vencido/inválido → limpiarlo para que la app quede consistente.
        if (err instanceof ApiError && err.status === 401) clearTokens();
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return { user, loading, logout };
}
