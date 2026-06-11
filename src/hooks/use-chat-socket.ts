import { useCallback, useEffect, useRef, useState } from "react";
import {
  chatSocketUrl,
  type ChatSocketCommand,
  type ChatSocketEvent,
} from "@/integrations/api/chat";

/**
 * Mantiene vivo el WebSocket del chat con reconexión automática (backoff).
 * `enabled` debe ser true solo cuando hay un usuario logueado.
 *
 * Devuelve `{ connected, send }`. Los eventos del servidor llegan por
 * `onEvent`, que se lee desde una ref para no reabrir el socket en cada render.
 */
export function useChatSocket(enabled: boolean, onEvent: (event: ChatSocketEvent) => void) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const closedByUs = useRef(false);

  onEventRef.current = onEvent;

  const send = useCallback((command: ChatSocketCommand): boolean => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(command));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    closedByUs.current = false;

    function connect() {
      const url = chatSocketUrl();
      if (!url) return;

      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;
        setConnected(true);
      };

      ws.onmessage = (ev) => {
        try {
          onEventRef.current(JSON.parse(ev.data) as ChatSocketEvent);
        } catch {
          /* ignora payloads no-JSON */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        socketRef.current = null;
        if (closedByUs.current) return;
        // Reconexión con backoff exponencial (máx. 15s).
        const delay = Math.min(1000 * 2 ** attemptsRef.current, 15000);
        attemptsRef.current += 1;
        reconnectRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      closedByUs.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  return { connected, send };
}
