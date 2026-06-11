import { useEffect, useState } from "react";
import { MessageSquarePlus, Search } from "lucide-react";
import type { ChatContact, Conversation } from "@/integrations/api/chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./parts";
import { formatTime } from "./chat-format";

interface ChatInboxProps {
  conversations: Conversation[];
  contacts: ChatContact[];
  loading: boolean;
  onOpenConversation: (conversationId: number) => void;
  onOpenWithUser: (userId: number) => void;
  onSearch: (term: string) => void;
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function ChatInbox({
  conversations,
  contacts,
  loading,
  onOpenConversation,
  onOpenWithUser,
  onSearch,
}: ChatInboxProps) {
  const [term, setTerm] = useState("");

  // Búsqueda con debounce para no pegarle al backend en cada tecla.
  useEffect(() => {
    const id = setTimeout(() => onSearch(term), 250);
    return () => clearTimeout(id);
  }, [term, onSearch]);

  return (
    <Tabs defaultValue="chats" className="flex h-full flex-col">
      <div className="px-3 pt-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
        </TabsList>
      </div>

      {/* CHATS */}
      <TabsContent value="chats" className="mt-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <ListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<MessageSquarePlus className="h-7 w-7" />}
            title="Sin conversaciones"
            subtitle="Ve a Contactos para empezar a chatear."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onOpenConversation(c.id)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-muted/60"
                >
                  <ChatAvatar user={c.other_user} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {c.other_user.full_name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatTime(c.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-xs",
                          c.unread_count > 0
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {c.last_message?.body || "Sin mensajes"}
                      </span>
                      <UnreadBadge count={c.unread_count} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      {/* CONTACTOS */}
      <TabsContent value="contacts" className="mt-0 flex flex-1 flex-col overflow-hidden">
        <div className="relative px-3 py-2">
          <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar usuario…"
            className="w-full rounded-full border border-border bg-muted/40 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary/40 focus:bg-background"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && contacts.length === 0 ? (
            <ListSkeleton />
          ) : contacts.length === 0 ? (
            <EmptyState title="Sin resultados" subtitle="Prueba con otro nombre." />
          ) : (
            <ul className="divide-y divide-border/60">
              {contacts.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => onOpenWithUser(u.id)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-muted/60"
                  >
                    <ChatAvatar user={u} size={44} />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {u.full_name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {u.role_display}
                      </span>
                    </div>
                    <UnreadBadge count={u.unread_count} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="text-muted-foreground/60">{icon}</div>}
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-1 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-2">
          <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
