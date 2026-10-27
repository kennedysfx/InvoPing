

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowUp, Check, CheckCheck, FileText, ImagePlus, Loader2, MessageCircle, Paperclip, RefreshCw, X } from "lucide-react";
import type { SupportChatState, SupportDraftAttachment, SupportMessage, SupportMessageInput, SupportTopic } from "./support-types";

const TOPICS: SupportTopic[] = [
  {
    id: "invoices",
    title: "Creating or sending invoices",
    starterMessage:
      "Hi, I need help creating or sending an invoice. ",
  },
  {
    id: "account",
    title: "Account and sign-in help",
    starterMessage:
      "Hi, I need help with my account or signing in. ",
  },
  {
    id: "billing",
    title: "Payments and subscriptions",
    starterMessage:
      "Hi, I have a question about payments or my subscription. ",
  },
  {
    id: "whatsapp",
    title: "WhatsApp invoice links",
    starterMessage:
      "Hi, my WhatsApp invoice link is not working. ",
  },
  {
    id: "technical",
    title: "Report a technical issue",
    starterMessage:
      "Hi, I would like to report a technical issue. ",
  },
  {
    id: "other",
    title: "Something else",
    starterMessage:
      "Hi InvoPing Support, I need help with ",
  },
];

const FILE_LIMIT = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_EXTENSIONS = [
  "pdf",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
];

const CONTROL =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#557362] transition-colors hover:bg-[#edf6ee] hover:text-[#064b32] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#079333]";

type SupportChatProps = {
  authenticated: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSignInRequired: () => void;
  messages?: SupportMessage[];
  state?: SupportChatState;
  hasOlderMessages?: boolean;
  onLoadOlder?: () => Promise<void>;
  onRetry?: () => void;
  onSend?: (input: SupportMessageInput) => Promise<void>;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageTime({ value }: { value: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const date = new Date(value);

    setLabel(
      Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
    );
  }, [value]);

  return <time dateTime={value}>{label}</time>;
}

export default function SupportChat({
  authenticated,
  draft,
  onDraftChange,
  onSignInRequired,
  messages = [],
  state = "UNAVAILABLE",
  hasOlderMessages = false,
  onLoadOlder,
  onRetry,
  onSend,
}: SupportChatProps) {
  const [attachments, setAttachments] = useState<
    SupportDraftAttachment[]
  >([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const followLatestRef = useRef(true);

  const lastMessageId = messages[messages.length - 1]?.id;
  const busy = sending || state === "LOADING";
  const hasContent = Boolean(draft.trim() || attachments.length);

  // Release local image previews when leaving this page.
  useEffect(() => {
    const urls = previewUrlsRef.current;

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  // Resize the composer while keeping long drafts scrollable.
  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      160
    )}px`;
  }, [draft]);

  // Scroll only the conversation, never the whole webpage.
  useEffect(() => {
    const history = historyRef.current;

    if (history && followLatestRef.current) {
      history.scrollTop = history.scrollHeight;
    }
  }, [lastMessageId]);

function selectTopic(topic: SupportTopic) {
  onDraftChange(topic.starterMessage);
  setError("");
  composerRef.current?.focus({ preventScroll: true });
}

  function addFiles(
    selected: FileList | null,
    kind: "IMAGE" | "DOCUMENT"
  ) {
    if (!selected) return;

    const added: SupportDraftAttachment[] = [];
    const problems: string[] = [];

    for (const file of Array.from(selected)) {
      if (attachments.length + added.length >= FILE_LIMIT) {
        problems.push(`You can attach up to ${FILE_LIMIT} files.`);
        break;
      }

      const extension = file.name.split(".").pop()?.toLowerCase();

      const validType =
        kind === "IMAGE"
          ? ["image/jpeg", "image/png", "image/webp", "image/gif"]
              .includes(file.type)
          : DOCUMENT_EXTENSIONS.includes(extension || "");

      if (!validType) {
        problems.push(`${file.name}: this file type is not supported.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        problems.push(`${file.name}: choose a file smaller than 5 MB.`);
        continue;
      }

      const duplicate = [...attachments, ...added].some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified
      );

      if (duplicate) continue;

      const previewUrl =
        kind === "IMAGE" ? URL.createObjectURL(file) : undefined;

      if (previewUrl) {
        previewUrlsRef.current.add(previewUrl);
      }

      added.push({
        id: crypto.randomUUID(),
        kind,
        file,
        previewUrl,
      });
    }

    setAttachments((current) => [...current, ...added]);
    setError(problems.join(" "));
  }

  function removeAttachment(id: string) {
    const attachment = attachments.find((item) => item.id === id);

    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
      previewUrlsRef.current.delete(attachment.previewUrl);
    }

    setAttachments((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  async function submitMessage() {
    if (!hasContent || busy) return;

    setError("");

    if (!authenticated) {
      onSignInRequired();
      return;
    }

    if (state !== "READY" || !onSend) {
      setError(
        "Support messaging is not available yet. Your message has not been sent."
      );
      return;
    }

    setSending(true);

    try {
      await onSend({
        text: draft.trim(),
        files: attachments.map((item) => item.file),
      });

      // Clear only after the future transport confirms success.
      onDraftChange("");

      attachments.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
          previewUrlsRef.current.delete(item.previewUrl);
        }
      });

      setAttachments([]);
      followLatestRef.current = true;
    } catch {
      setError(
        "Your message could not be sent. Your draft is still here. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  async function loadOlder() {
    if (!onLoadOlder || loadingOlder) return;

    const history = historyRef.current;
    const oldHeight = history?.scrollHeight ?? 0;
    const oldTop = history?.scrollTop ?? 0;

    setLoadingOlder(true);
    setError("");

    try {
      await onLoadOlder();

      requestAnimationFrame(() => {
        if (history) {
          history.scrollTop =
            oldTop + history.scrollHeight - oldHeight;
        }
      });
    } catch {
      setError("Older messages could not be loaded. Please try again.");
    } finally {
      setLoadingOlder(false);
    }
  }

  return (
    <section
      aria-label="Contact InvoPing Support"
      className="flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#dce8df] bg-white shadow-[0_16px_60px_rgba(6,75,50,0.06)]"
    >
      {/* Conversation header */}
      <div className="flex items-center gap-3 border-b border-[#e7eee9] px-4 py-4 sm:px-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e7f2e9] text-[#079333]">
          <MessageCircle size={23} aria-hidden="true" />
        </span>

        <div>
          <h2 className="text-sm font-semibold text-[#103f2f]">
            InvoPing Support
          </h2>

          <p className="mt-1 text-[11px] text-[#66766e]">
            Account, invoicing and billing help
          </p>
        </div>
      </div>



      {/* Conversation history */}
      <div
        ref={historyRef}
        tabIndex={0}
        aria-label="Conversation history"
        aria-busy={state === "LOADING"}
        onScroll={() => {
          const history = historyRef.current;
          if (!history) return;

          followLatestRef.current =
            history.scrollHeight -
              history.scrollTop -
              history.clientHeight <
            80;
        }}
        className="h-[min(52dvh,480px)] min-h-[280px] overflow-y-auto overscroll-contain bg-[#fbfdfb] px-4 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#079333] sm:px-6"
      >
        {state === "LOADING" ? (
          <div
            role="status"
            className="flex h-full items-center justify-center gap-2 text-sm text-[#66766e]"
          >
            <Loader2 size={18} className="animate-spin" />
            Loading your conversation…
          </div>
        ) : state === "ERROR" ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <AlertCircle size={28} className="text-[#66766e]" />

            <p className="mt-3 text-sm text-[#103f2f]">
              We couldn’t load your conversation.
            </p>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#cadccf] px-4 py-2.5 text-xs font-semibold text-[#064b32] hover:bg-[#edf6ee]"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="mx-auto flex min-h-full max-w-[580px] flex-col justify-center">
            <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf6ee] text-[#079333]">
              <MessageCircle size={24} aria-hidden="true" />
            </span>

            <h3 className="text-2xl font-semibold tracking-[-0.035em] text-[#103f2f]">
              Let’s start with what you need.
            </h3>

            <p className="mt-3 text-xs leading-6 text-[#66766e]">
              Choose a topic or write your own message below.
              You can edit a suggested message before sending.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => selectTopic(topic)}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[#dce8df] bg-white px-4 py-3 text-left text-xs font-medium text-[#103f2f] transition-colors hover:border-[#85bf94] hover:bg-[#f3f8f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#079333]"
                >
                  {topic.title}
                  <span aria-hidden="true" className="text-[#079333]">
                    ↗
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {hasOlderMessages && onLoadOlder && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => void loadOlder()}
                  disabled={loadingOlder}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-[#167638] hover:bg-[#edf6ee] disabled:opacity-50"
                >
                  {loadingOlder ? "Loading…" : "Load older messages"}
                </button>
              </div>
            )}

            {messages.map((message) => {
              const customerMessage = message.sender === "CUSTOMER";

              return (
                <article
                  key={message.id}
                  aria-label={
                    customerMessage ? "Your message" : "Support reply"
                  }
                  className={`flex ${
                    customerMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[90%] sm:max-w-[80%]">
                    <p
                      className={`mb-1.5 text-[10px] font-medium text-[#66766e] ${
                        customerMessage ? "text-right" : ""
                      }`}
                    >
                      {customerMessage
                        ? "You"
                        : message.senderName || "InvoPing Support"}
                    </p>

                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        customerMessage
                          ? "rounded-br-sm bg-[#064b32] text-white"
                          : "rounded-bl-sm border border-[#dce8df] bg-white text-[#103f2f]"
                      }`}
                    >
                      {message.text && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.text}
                        </p>
                      )}

                      {message.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block overflow-hidden rounded-xl border border-current/15 p-2 focus-visible:outline focus-visible:outline-2"
                        >
                          {attachment.kind === "IMAGE" ? (
                            <Image
                              src={attachment.url}
                              alt={attachment.name}
                              width={320}
                              height={220}
                              unoptimized
                              className="max-h-56 w-full rounded-lg object-contain"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText size={20} className="shrink-0" />
                              <span className="break-all text-xs">
                                {attachment.name}
                              </span>
                            </div>
                          )}

                          <span className="mt-1 block text-[10px] opacity-75">
                            {formatSize(attachment.size)}
                          </span>
                        </a>
                      ))}
                    </div>

                    <div
                      className={`mt-1.5 flex items-center gap-2 text-[10px] text-[#788c7e] ${
                        customerMessage ? "justify-end" : ""
                      }`}
                    >
                      <MessageTime value={message.createdAt} />

                      {customerMessage && message.status && (
                        <span className="inline-flex items-center gap-1">
                          {message.status === "READ" ||
                          message.status === "DELIVERED" ? (
                            <CheckCheck size={13} aria-hidden="true" />
                          ) : message.status === "SENT" ? (
                            <Check size={13} aria-hidden="true" />
                          ) : null}

                          {message.status.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Local attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-3 overflow-x-auto border-t border-[#e7eee9] px-4 py-3 sm:px-6">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative flex w-44 shrink-0 items-center gap-2 rounded-xl border border-[#dce8df] bg-[#f3f8f4] p-2 pr-7"
            >
              {attachment.previewUrl ? (
                <Image
                  src={attachment.previewUrl}
                  alt={`Selected image: ${attachment.file.name}`}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <FileText
                  size={25}
                  className="shrink-0 text-[#167638]"
                />
              )}

              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium text-[#103f2f]">
                  {attachment.file.name}
                </p>

                <p className="mt-1 text-[9px] text-[#66766e]">
                  {formatSize(attachment.file.size)} · Not uploaded
                </p>
              </div>

              <button
                type="button"
                disabled={sending}
                onClick={() => removeAttachment(attachment.id)}
                aria-label={`Remove ${attachment.file.name}`}
                className="absolute right-1 top-1 rounded-md p-1 text-[#66766e] hover:bg-white hover:text-[#103f2f]"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitMessage();
        }}
        className="border-t border-[#e7eee9] bg-white p-3 sm:p-5"
      >
        <label htmlFor="support-message" className="sr-only">
          Your message to InvoPing Support
        </label>

        <textarea
          ref={composerRef}
          id="support-message"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
const desktop = window.matchMedia("(pointer: fine)").matches;

            if (
              desktop &&
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void submitMessage();
            }
          }}
          disabled={busy}
          rows={2}
          maxLength={5000}
          placeholder="Tell us what you need help with…"
          aria-describedby="support-composer-help"
          className="block max-h-40 min-h-[72px] w-full resize-none rounded-xl border border-[#dce8df] bg-[#fbfdfb] px-4 py-3 text-base leading-6 text-[#103f2f] placeholder:text-[#8a9a90] focus:border-[#079333] focus:outline-none focus:ring-1 focus:ring-[#079333] disabled:opacity-60 sm:text-sm"
        />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(event) => {
            addFiles(event.target.files, "IMAGE");
            event.target.value = "";
          }}
        />

        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
          multiple
          hidden
          onChange={(event) => {
            addFiles(event.target.files, "DOCUMENT");
            event.target.value = "";
          }}
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy || attachments.length >= FILE_LIMIT}
              onClick={() => imageInputRef.current?.click()}
              aria-label="Attach images"
              title="Attach images"
              className={CONTROL}
            >
              <ImagePlus size={20} />
            </button>

            <button
              type="button"
              disabled={busy || attachments.length >= FILE_LIMIT}
              onClick={() => documentInputRef.current?.click()}
              aria-label="Attach documents"
              title="Attach documents"
              className={CONTROL}
            >
              <Paperclip size={20} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!hasContent || busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#079333] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#067b2c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#079333] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <ArrowUp size={17} />
            )}

            {sending ? "Sending…" : "Send"}
          </button>
        </div>

        <p
          id="support-composer-help"
          className="mt-2 text-[10px] leading-5 text-[#788c7e]"
        >
          Up to 3 files, 5 MB each. Don’t include passwords or
          verification codes.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900"
          >
            {error}
          </p>
        )}
      </form>
    </section>
  );
}