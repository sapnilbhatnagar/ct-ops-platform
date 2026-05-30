"use client";

import { Mic, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isUnsupported = message.type === "voice" || message.type === "image";

  return (
    <div
      data-testid={`message-${message.id}`}
      data-role={message.role}
      data-type={message.type}
      className={cn("flex w-full", isUser ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed",
          isUser ? "border border-rule bg-tile text-ink" : "bg-accent text-white",
          isUnsupported && "flex items-center gap-2 italic text-mute",
        )}
      >
        {message.type === "voice" ? (
          <>
            <Mic className="size-4 shrink-0" />
            <span>{message.content}</span>
          </>
        ) : message.type === "image" ? (
          <>
            <ImageIcon className="size-4 shrink-0" />
            <span>{message.content}</span>
          </>
        ) : (
          <span>{message.content}</span>
        )}
        {message.highlights && message.highlights.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.highlights.map((h) => (
              <span
                key={h}
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.12em]",
                  isUser ? "bg-paper/15 text-paper/80" : "bg-accent/10 text-accent",
                )}
              >
                {h.replace("_", " ")}
              </span>
            ))}
          </div>
        ) : null}
        <div
          className={cn(
            "mt-1 text-[10.5px] tabular-nums",
            isUser ? "text-paper/55" : "text-mute",
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export function ConversationThread({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-mute">
        No messages yet.
      </div>
    );
  }

  return (
    <div data-testid="conversation-thread" className="flex flex-col gap-3 px-8 py-6">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
    </div>
  );
}
