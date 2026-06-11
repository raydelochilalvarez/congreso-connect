import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchContacts,
  fetchConversations,
  fetchMessages,
  markConversationRead,
  openConversationWith,
  type ChatContact,
  type ChatMessage,
  type ChatSocketCommand,
  type ChatSocketEvent,
  type Conversation,
} from "@/integrations/api/chat";
import { playMessageSound } from "@/lib/chat-notify";
import { useChatSocket } from "./use-chat-socket";

const noopSend = (_: ChatSocketCommand) => false;

interface ThreadMeta {
  page: number;
  hasMore: boolean;
}

/**
 * Estado completo del chat para el widget del header: bandeja, contactos,
 * conversación activa, mensajes en vivo, "escribiendo…" y no leídos.
 *
 * El socket queda abierto mientras haya sesión (para que el badge de no leídos
 * se actualice aunque el panel esté cerrado).
 */
export function useChat(currentUserId: number | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>({});
  const [typing, setTyping] = useState<Record<number, boolean>>({});
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadMeta, setThreadMeta] = useState<Record<number, ThreadMeta>>({});
  const [loadingMore, setLoadingMore] = useState(false);

  const enabled = currentUserId != null;

  // Refs para leer estado fresco dentro del handler del socket (sin re-suscribir).
  const activeIdRef = useRef<number | null>(null);
  const userIdRef = useRef<number | null>(currentUserId);
  const conversationsRef = useRef<Conversation[]>([]);
  const threadMetaRef = useRef<Record<number, ThreadMeta>>({});
  const loadingMoreRef = useRef(false);
  const sendRef = useRef<(c: ChatSocketCommand) => boolean>(noopSend);
  const typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  activeIdRef.current = activeId;
  userIdRef.current = currentUserId;
  conversationsRef.current = conversations;
  threadMetaRef.current = threadMeta;

  const refreshInbox = useCallback(async () => {
    if (!enabled) return;
    setLoadingInbox(true);
    try {
      const [convs, conts] = await Promise.all([fetchConversations(), fetchContacts()]);
      setConversations(convs);
      setContacts(conts);
    } finally {
      setLoadingInbox(false);
    }
  }, [enabled]);

  const searchContacts = useCallback(
    async (term: string) => {
      if (!enabled) return;
      setContacts(await fetchContacts(term || undefined));
    },
    [enabled],
  );

  const upsertMessage = useCallback((convId: number, msg: ChatMessage) => {
    setMessages((prev) => {
      const list = prev[convId] || [];
      if (list.some((m) => m.id === msg.id)) return prev;
      return { ...prev, [convId]: [...list, msg] };
    });
  }, []);

  const bumpConversation = useCallback((convId: number, msg: ChatMessage, incUnread: boolean) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === convId);
      if (idx === -1) return prev; // conversación nueva → la resuelve refreshInbox
      const conv = prev[idx];
      const updated: Conversation = {
        ...conv,
        last_message: msg,
        last_message_at: msg.created_at,
        unread_count: incUnread ? conv.unread_count + 1 : conv.unread_count,
      };
      return [updated, ...prev.filter((_, i) => i !== idx)];
    });
  }, []);

  // --- entrega en vivo (lee refs, por eso no depende de estado) ----------
  const handleEvent = useCallback(
    (event: ChatSocketEvent) => {
      const me = userIdRef.current;
      if (event.type === "message") {
        const { conversation_id: convId, message } = event;
        const mine = message.sender === me;
        const isActive = activeIdRef.current === convId;
        upsertMessage(convId, message);

        const known = conversationsRef.current.some((c) => c.id === convId);
        if (!known) {
          void refreshInbox(); // primera vez que aparece esta conversación
        } else {
          bumpConversation(convId, message, !mine && !isActive);
        }

        if (isActive && !mine) {
          sendRef.current({ type: "read", conversation: convId });
          void markConversationRead(convId);
        }

        // Sonido solo para mensajes entrantes que el usuario no está viendo.
        const hidden = typeof document !== "undefined" && document.hidden;
        if (!mine && (hidden || !isActive)) playMessageSound();
      } else if (event.type === "typing") {
        const convId = event.conversation_id;
        setTyping((prev) => ({ ...prev, [convId]: event.state }));
        clearTimeout(typingTimers.current[convId]);
        if (event.state) {
          typingTimers.current[convId] = setTimeout(
            () => setTyping((prev) => ({ ...prev, [convId]: false })),
            5000,
          );
        }
      } else if (event.type === "read") {
        const convId = event.conversation_id;
        const now = new Date().toISOString();
        setMessages((prev) => {
          const list = prev[convId];
          if (!list) return prev;
          return {
            ...prev,
            [convId]: list.map((m) => (m.sender === me && !m.read_at ? { ...m, read_at: now } : m)),
          };
        });
      }
    },
    [upsertMessage, bumpConversation, refreshInbox],
  );

  const { connected, send } = useChatSocket(enabled, handleEvent);
  sendRef.current = send;

  // Carga inicial de la bandeja (para el badge) al loguearse.
  useEffect(() => {
    if (enabled) void refreshInbox();
  }, [enabled, refreshInbox]);

  // --- acciones del usuario ---------------------------------------------
  const loadThread = useCallback(
    async (convId: number) => {
      if (messages[convId]) return; // ya cargado
      setLoadingThread(true);
      try {
        const { messages: history, hasMore } = await fetchMessages(convId);
        setMessages((prev) => ({ ...prev, [convId]: history }));
        setThreadMeta((prev) => ({ ...prev, [convId]: { page: 1, hasMore } }));
      } finally {
        setLoadingThread(false);
      }
    },
    [messages],
  );

  /** Carga la página siguiente (mensajes más antiguos) y la antepone. */
  const loadOlder = useCallback(async (convId: number) => {
    const meta = threadMetaRef.current[convId];
    if (!meta || !meta.hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = meta.page + 1;
      const { messages: older, hasMore } = await fetchMessages(convId, nextPage);
      setMessages((prev) => {
        const existing = prev[convId] || [];
        const ids = new Set(existing.map((m) => m.id));
        const fresh = older.filter((m) => !ids.has(m.id));
        return { ...prev, [convId]: [...fresh, ...existing] };
      });
      setThreadMeta((prev) => ({ ...prev, [convId]: { page: nextPage, hasMore } }));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const markRead = useCallback((convId: number) => {
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)));
    sendRef.current({ type: "read", conversation: convId });
    void markConversationRead(convId);
  }, []);

  const openConversation = useCallback(
    async (convId: number) => {
      setActiveId(convId);
      await loadThread(convId);
      markRead(convId);
    },
    [loadThread, markRead],
  );

  const openWithUser = useCallback(
    async (userId: number) => {
      const conv = await openConversationWith(userId);
      setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]));
      await openConversation(conv.id);
    },
    [openConversation],
  );

  const closeThread = useCallback(() => setActiveId(null), []);

  const sendMessage = useCallback((body: string) => {
    const text = body.trim();
    const conv = conversationsRef.current.find((c) => c.id === activeIdRef.current);
    if (!text || !conv) return false;
    // El servidor reenvía el mensaje también al emisor → se pinta al llegar.
    return sendRef.current({ type: "message.send", to: conv.other_user.id, body: text });
  }, []);

  const notifyTyping = useCallback((state: boolean) => {
    const convId = activeIdRef.current;
    if (convId != null) sendRef.current({ type: "typing", conversation: convId, state });
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId],
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations],
  );

  // Refleja los no leídos en el título de la pestaña: "(3) Muchik 2026".
  useEffect(() => {
    if (typeof document === "undefined") return;
    const base = document.title.replace(/^\(\d+\)\s/, "");
    document.title = totalUnread > 0 ? `(${totalUnread}) ${base}` : base;
  }, [totalUnread]);

  return {
    connected,
    conversations,
    contacts,
    activeConversation,
    activeMessages: activeId != null ? messages[activeId] || [] : [],
    activeHasMore: activeId != null ? Boolean(threadMeta[activeId]?.hasMore) : false,
    typingActive: activeId != null ? Boolean(typing[activeId]) : false,
    totalUnread,
    loadingInbox,
    loadingThread,
    loadingMore,
    refreshInbox,
    searchContacts,
    openConversation,
    openWithUser,
    closeThread,
    loadOlder,
    sendMessage,
    notifyTyping,
  };
}
