import { mediaUrl } from "@/integrations/api/client";
import type { ChatUser } from "@/integrations/api/chat";
import { cn } from "@/lib/utils";
import { chatInitials } from "./chat-format";

export function ChatAvatar({
  user,
  size = 40,
  online,
}: {
  user: Pick<ChatUser, "first_name" | "last_name" | "full_name" | "avatar">;
  size?: number;
  online?: boolean;
}) {
  const src = mediaUrl(user.avatar);
  return (
    <span className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt={user.full_name}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full font-semibold text-primary-foreground shadow-[var(--shadow-brand)]"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.38,
            background: "var(--gradient-brand)",
          }}
        >
          {chatInitials(user)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            online ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
        />
      )}
    </span>
  );
}
