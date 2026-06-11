import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, Loader2, Send } from "lucide-react";
import type { ChatMessage, Conversation } from "@/integrations/api/chat";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./parts";
import { dayLabel, formatTime } from "./chat-format";

interface ChatThreadProps {
  conversation: Conversation;
  messages: ChatMessage[];
  currentUserId: number;
  typingActive: boolean;
  connected: boolean;
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onBack: () => void;
  onSend: (body: string) => boolean;
  onTyping: (state: boolean) => void;
  onLoadOlder: () => void;
}

export function ChatThread({
  conversation,
  messages,
  currentUserId,
  typingActive,
  connected,
  loading,
  hasMore,
  loadingMore,
  onBack,
  onSend,
  onTyping,
  onLoadOlder,
}: ChatThreadProps) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  // Para conservar la posición visual al anteponer mensajes antiguos.
  const prevFirstIdRef = useRef<number | undefined>(undefined);
  const prevScrollHeightRef = useRef(0);
  const pendingPrependRef = useRef(false);

  const other = conversation.other_user;

  // Mantiene el scroll: al fondo con mensajes nuevos; fijo al cargar antiguos.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const firstId = messages[0]?.id;
    if (pendingPrependRef.current && firstId !== prevFirstIdRef.current) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      pendingPrependRef.current = false;
    } else {
      el.scrollTop = el.scrollHeight;
    }
    prevFirstIdRef.current = firstId;
    prevScrollHeightRef.current = el.scrollHeight;
  }, [messages, typingActive]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || !hasMore || loadingMore) return;
    if (el.scrollTop < 60) {
      pendingPrependRef.current = true;
      prevScrollHeightRef.current = el.scrollHeight;
      onLoadOlder();
    }
  }

  function stopTyping() {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
  }

  function handleChange(value: string) {
    setText(value);
    // Autosize del textarea.
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
    // Señal de "escribiendo…" con apagado por inactividad.
    if (!isTypingRef.current && value.trim()) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 1500);
  }

  function submit() {
    if (!text.trim()) return;
    const ok = onSend(text);
    if (ok) {
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      stopTyping();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-3">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="rounded-full p-1.5 text-foreground/70 transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <ChatAvatar user={other} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{other.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {typingActive ? (
              <span className="text-secondary">escribiendo…</span>
            ) : (
              other.role_display
            )}
          </p>
        </div>
      </div>

      {/* Mensajes */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-1 overflow-y-auto bg-muted/30 px-3 py-4"
      >
        {loadingMore && (
          <div className="flex justify-center py-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {loading && messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <ChatAvatar user={other} size={56} />
            <p className="text-sm font-medium text-foreground">{other.full_name}</p>
            <p className="max-w-[220px] text-xs text-muted-foreground">
              Aún no hay mensajes. ¡Saluda y empieza la conversación!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const mine = msg.sender === currentUserId;
            const prev = messages[i - 1];
            const showDay = !prev || dayLabel(prev.created_at) !== dayLabel(msg.created_at);
            return (
              <div key={msg.id}>
                {showDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                      {dayLabel(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-background text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <span
                      className={cn(
                        "mt-0.5 flex items-center justify-end gap-1 text-[10px]",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {formatTime(msg.created_at)}
                      {mine &&
                        (msg.read_at ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        ))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typingActive && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-background px-3 py-2 shadow-sm">
              <span className="flex gap-1">
                <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background px-3 py-2.5">
        {!connected && <p className="mb-1 text-center text-[11px] text-amber-600">Reconectando…</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            rows={1}
            placeholder="Escribe un mensaje…"
            className="max-h-[120px] flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:bg-background"
          />
          <button
            onClick={submit}
            disabled={!text.trim()}
            aria-label="Enviar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-95 disabled:opacity-40"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay }}
    />
  );
}
