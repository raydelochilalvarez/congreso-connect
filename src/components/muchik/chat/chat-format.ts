import type { ChatUser } from "@/integrations/api/chat";

/** Iniciales para el avatar (nombre + apellido, fallback a la primera letra). */
export function chatInitials(
  user: Pick<ChatUser, "first_name" | "last_name" | "full_name">,
): string {
  const a = (user.first_name || "").trim().charAt(0);
  const b = (user.last_name || "").trim().charAt(0);
  const initials = `${a}${b}`.toUpperCase();
  if (initials) return initials;
  return ((user.full_name || "?").trim().charAt(0) || "?").toUpperCase();
}

/** Hora corta (HH:mm) de un ISO string. */
export function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

/** Etiqueta de día para separar mensajes (Hoy / Ayer / fecha). */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (x: Date, y: Date) =>
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate();
  if (sameDay(d, today)) return "Hoy";
  if (sameDay(d, yesterday)) return "Ayer";
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "long" });
}
