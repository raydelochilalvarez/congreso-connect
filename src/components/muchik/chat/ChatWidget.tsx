import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { ChatInbox } from "./ChatInbox";
import { ChatThread } from "./ChatThread";

/**
 * Widget de chat para el header. Botón con badge de no leídos + panel lateral
 * (pantalla completa en móvil) que alterna entre la bandeja y la conversación.
 * Solo debe montarse cuando hay un usuario logueado.
 */
export function ChatWidget({
  currentUserId,
  className,
}: {
  currentUserId: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const chat = useChat(currentUserId);
  const { refreshInbox, closeThread, activeConversation } = chat;

  // Al abrir el panel, refresca la bandeja y vuelve a la lista.
  useEffect(() => {
    if (open) {
      closeThread();
      void refreshInbox();
    }
  }, [open, refreshInbox, closeThread]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Mensajes"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition hover:bg-muted hover:text-secondary",
          className,
        )}
      >
        <MessageCircle className="h-[22px] w-[22px]" />
        {chat.totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
            {chat.totalUnread > 99 ? "99+" : chat.totalUnread}
          </span>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        {activeConversation ? (
          <>
            <SheetTitle className="sr-only">
              Conversación con {activeConversation.other_user.full_name}
            </SheetTitle>
            <ChatThread
              conversation={activeConversation}
              messages={chat.activeMessages}
              currentUserId={currentUserId}
              typingActive={chat.typingActive}
              connected={chat.connected}
              loading={chat.loadingThread}
              hasMore={chat.activeHasMore}
              loadingMore={chat.loadingMore}
              onBack={chat.closeThread}
              onSend={chat.sendMessage}
              onTyping={chat.notifyTyping}
              onLoadOlder={() => chat.loadOlder(activeConversation.id)}
            />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5 pr-12">
              <SheetTitle className="text-base font-bold text-foreground">Mensajes</SheetTitle>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    chat.connected ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                />
                {chat.connected ? "En línea" : "Conectando…"}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInbox
                conversations={chat.conversations}
                contacts={chat.contacts}
                loading={chat.loadingInbox}
                onOpenConversation={chat.openConversation}
                onOpenWithUser={chat.openWithUser}
                onSearch={chat.searchContacts}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
