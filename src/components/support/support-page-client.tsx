"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
  X,
} from "lucide-react";

import BrandLogo from "@/components/brand-logo";
import SupportChat from "./support-chat";
import type { SupportCustomer } from "./support-types";

const DRAFT_KEY = "invoping-support-draft";
const DRAFT_LIFETIME = 30 * 60 * 1000;

const CONTAINER =
  "mx-auto w-[calc(100%-40px)] max-w-[1180px] md:w-[calc(100%-64px)]";

type SupportPageClientProps = {
  customer: SupportCustomer | null;
};

export default function SupportPageClient({
  customer,
}: SupportPageClientProps) {
  const [draft, setDraft] = useState("");
  const [signInOpen, setSignInOpen] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Restore the draft once, then remove the stored copy.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      if (!stored) return;

      sessionStorage.removeItem(DRAFT_KEY);

      const saved: unknown = JSON.parse(stored);

      if (
        typeof saved === "object" &&
        saved !== null &&
        "text" in saved &&
        "expiresAt" in saved &&
        typeof saved.text === "string" &&
        typeof saved.expiresAt === "number" &&
        saved.expiresAt > Date.now()
      ) {
        setDraft(saved.text.slice(0, 5000));
      }
    } catch {
      // Storage may be unavailable; the page still works.
    }
  }, []);

  // Native dialog provides focus trapping and Escape handling.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!signInOpen || !dialog) return;

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;

    html.style.overflow = "hidden";
    dialog.showModal();

    return () => {
      dialog.close();
      html.style.overflow = previousOverflow;
    };
  }, [signInOpen]);

  function preserveDraftForSignIn() {
    try {
      if (!draft.trim()) {
        sessionStorage.removeItem(DRAFT_KEY);
        return;
      }

      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          text: draft,
          expiresAt: Date.now() + DRAFT_LIFETIME,
        })
      );
    } catch {
      // Sign-in remains available if storage is blocked.
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f8f4] font-sans text-[#103f2f] antialiased">
      <a
        href="#support-main"
        className="sr-only fixed left-5 top-3 z-[100] rounded-xl bg-white px-5 py-3 text-[#064b32] focus:not-sr-only"
      >
        Skip to support
      </a>

      <header className="border-b border-[#e6eee8] bg-white">
        <div
          className={`${CONTAINER} flex min-h-[72px] items-center justify-between gap-4 md:min-h-[84px]`}
        >
          <BrandLogo />

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg py-2 text-xs font-semibold text-[#557362] transition-colors hover:text-[#079333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#079333]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="hidden sm:inline">
              Back to home
            </span>
            <span className="sm:hidden">Home</span>
          </Link>
        </div>
      </header>

      <main
        id="support-main"
        className={`${CONTAINER} py-10 md:py-16`}
      >
        <div className="mb-8 max-w-[700px] md:mb-10">
          <span className="inline-flex rounded-full bg-[#e7f2e9] px-3.5 py-2 text-[10px] font-bold tracking-[0.12em] text-[#147d39]">
            INVOPING SUPPORT
          </span>

          <h1 className="mt-5 text-[38px] font-semibold leading-[1.1] tracking-[-0.045em] text-[#103f2f] md:text-[54px]">
            How can we help you?
          </h1>

          <p className="mt-4 max-w-[570px] text-sm leading-7 text-[#66766e] md:text-base md:leading-8">
            Have a question or need a hand? Tell us what’s
            happening, and include any details that help explain
            the issue.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
          <SupportChat
            authenticated={Boolean(customer)}
            draft={draft}
            onDraftChange={setDraft}
            onSignInRequired={() => setSignInOpen(true)}
            state="UNAVAILABLE"
          />

          <aside
            aria-label="Other support options"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
          >
            <div className="rounded-[24px] border border-[#dce8df] bg-white p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf6ee] text-[#167638]">
                <Mail size={20} aria-hidden="true" />
              </span>

              <h2 className="mt-4 text-base font-semibold tracking-tight">
                Prefer email?
              </h2>

              <p className="mt-2 text-xs leading-6 text-[#66766e]">
                You can also contact support by email.
              </p>

              <a
                href="mailto:support@invo.net"
                className="mt-4 inline-flex items-center gap-2 break-all text-xs font-semibold text-[#167638] hover:underline"
              >
                support@invo.net
                <ArrowRight
                  size={15}
                  className="shrink-0"
                  aria-hidden="true"
                />
              </a>
            </div>

            <div className="rounded-[24px] border border-[#dce8df] bg-[#e7f2e9] p-6">
              <h2 className="text-base font-semibold tracking-tight">
                A little detail helps.
              </h2>

              <p className="mt-3 text-xs leading-6 text-[#557362]">
                Include what you were trying to do, what
                happened, and any error message you saw.
              </p>

              <p className="mt-3 text-xs leading-6 text-[#557362]">
                Never share your password, verification code
                or full card details.
              </p>

              <Link
                href="/#faq"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#167638] hover:underline"
              >
                Browse FAQs
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-4 border-t border-[#e1eae3] bg-white py-6">
        <div
          className={`${CONTAINER} flex flex-col gap-3 text-[11px] leading-6 text-[#66766e] sm:flex-row sm:items-center sm:justify-between`}
        >
          <p>InvoPing · Customer Support</p>

          <Link
            href="/"
            className="font-medium text-[#167638] hover:underline"
          >
            Back 
          </Link>
        </div>
      </footer>

      <dialog
        ref={dialogRef}
        aria-labelledby="support-sign-in-title"
        aria-describedby="support-sign-in-description"
        onCancel={() => setSignInOpen(false)}
        onClose={() => setSignInOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setSignInOpen(false);
          }
        }}
        className="m-auto w-[calc(100%-40px)] max-w-[420px] overflow-visible rounded-[24px] border border-[#dce8df] bg-white p-0 text-[#103f2f] shadow-2xl backdrop:bg-[#063c29]/25 backdrop:backdrop-blur-[6px]"
      >
        <div className="relative p-7 sm:p-8">
          <button
            type="button"
            autoFocus
            onClick={() => setSignInOpen(false)}
            aria-label="Close sign-in prompt"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-[#66766e] hover:bg-[#edf6ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#079333]"
          >
            <X size={19} />
          </button>

          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e7f2e9] text-[#079333]">
            <LockKeyhole size={24} aria-hidden="true" />
          </span>

          <h2
            id="support-sign-in-title"
            className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.035em]"
          >
            Sign in to contact support
          </h2>

          <p
            id="support-sign-in-description"
            className="mt-3 text-sm leading-7 text-[#66766e]"
          >
            Please sign in to send your message and receive
            assistance from our support team.
          </p>

          <Link
            href="/sign-in?next=%2Fcontact"
            onClick={preserveDraftForSignIn}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#079333] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#067b2c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#079333]"
          >
            Sign In
            <ArrowRight size={17} aria-hidden="true" />
          </Link>

          <p className="mt-3 text-[10px] leading-5 text-[#788c7e]">
            Your text draft will be kept temporarily in this
            tab. Please reselect attachments after signing in.
          </p>
        </div>
      </dialog>
    </div>
  );
}