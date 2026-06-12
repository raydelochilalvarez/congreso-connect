// Control de aforo / asistencia contra el backend Django.
// El registrador escanea el QR (token UUID del asistente) o ingresa manual.

import { apiRequest } from "./client";
import type { Paginated } from "./ticket-types";

export interface AttendanceRecord {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  dni: string;
  method: "qr" | "manual";
  method_display: string;
  created_at: string;
}

/** Respuesta de los endpoints de registro (scan/manual). */
export interface AttendanceResult {
  /** true si se creó un registro nuevo; false si ya estaba registrado. */
  created: boolean;
  attendance: AttendanceRecord;
  detail: string;
}

/** Lista de asistencias (el `count` de la paginación = aforo total). */
export async function listAttendance(): Promise<Paginated<AttendanceRecord>> {
  return apiRequest<Paginated<AttendanceRecord>>("/api/v1/attendance/", { auth: true });
}

/** Registra asistencia a partir del token (UUID) que codifica el QR escaneado. */
export async function scanAttendance(token: string): Promise<AttendanceResult> {
  return apiRequest<AttendanceResult>("/api/v1/attendance/scan/", {
    method: "POST",
    auth: true,
    body: { token },
  });
}

/** Registra asistencia manual (nombres, apellidos, DNI). */
export async function manualAttendance(data: {
  first_name: string;
  last_name: string;
  dni: string;
}): Promise<AttendanceResult> {
  return apiRequest<AttendanceResult>("/api/v1/attendance/manual/", {
    method: "POST",
    auth: true,
    body: data,
  });
}
