
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export default function AdminReplyForm({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [text]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = text.trim();
    if (!message || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch("/admin/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          text: message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to send reply.");
      }

      setText("");
      router.refresh();
      textareaRef.current?.focus();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to send reply."
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-[#34434b]/50 bg-[#202c33] px-3 py-3 sm:px-5"
    >
      <div className="flex items-end gap-3">
        <div className="flex min-w-0 flex-1 items-center rounded-[24px] bg-[#2a3942] px-4 py-2">
          <label htmlFor="admin-support-reply" className="sr-only">
            Reply to customer
          </label>

          <textarea
            ref={textareaRef}
            id="admin-support-reply"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={5000}
            rows={1}
            disabled={sending}
            placeholder="Type a message"
            className="max-h-36 min-h-[28px] w-full resize-none overflow-y-auto border-0 bg-transparent py-1 text-sm leading-6 text-[#e9edef] placeholder:text-[#aebac1] focus:outline-none disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send reply"
          title="Send reply"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white transition-colors hover:bg-[#008f72] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <Loader2 size={19} className="animate-spin" />
          ) : (
            <Send size={19} />
          )}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 px-3 text-xs text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
