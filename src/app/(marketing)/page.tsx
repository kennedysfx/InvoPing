"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import BrandLogo from "@/components/brand-logo";
import {
  ArrowDown,
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  FileText,
  Menu,
  MessageCircle,
  Minus,
  Plus,
  Send,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { PLANS } from "@/config/plans";
import type { PlanTier } from "@/config/plans";

const CONTAINER = "mx-auto w-[calc(100%-40px)] max-w-[1180px] md:w-[calc(100%-64px)]";

const BUTTON =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600";

const GREEN_BUTTON =
  `${BUTTON} border-transparent bg-[#079333] text-white hover:bg-[#067b2c]`;

const OUTLINE_BUTTON =
  `${BUTTON} border-[#cadccf] bg-transparent text-[#064b32] hover:bg-[#edf6ef]`;

const NAVIGATION = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Who It’s For", href: "#who-its-for" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faq" },
  { label: "Contact", href: "#contact" },
];


const SOLUTIONS = [
  {
    icon: FileText,
    image: "/images/homepage/S2one.jpg",
imageAlt: "Business owner working on an invoice at a laptop",
    problem: "Creating invoices manually takes time.",
    title: "Professional invoices, without the repetitive work.",
    description:
      "Create invoices with your items, taxes, discounts, and automatically calculated totals.",
    detail: "Create. Download. Share.",
  },
  {
    icon: BellRing,
    image: "/images/homepage/S2two.jpg",
imageAlt: "Business owner following up with a customer by phone",
    problem: "Payment follow-ups are easy to forget.",
    title: "Keep payment reminders close at hand.",
    description:
      "Send reminders and follow up with customers about outstanding invoices.",
    detail: "A clearer way to follow up.",
  },
  {
    icon: Wallet,
    image: "/images/homepage/S2three.jpg",
imageAlt: "Business owner reviewing payment records",
    problem: "Outstanding balances are difficult to track.",
    title: "Know what’s paid and what’s still due.",
    description:
      "Record full or partial payments and keep the remaining balance in view.",
    detail: "Every payment accounted for.",
  },
  {
    icon: Users,
    image: "/images/homepage/S2four.jpg",
imageAlt: "Professional organising client information",
    problem: "Customer records are scattered.",
    title: "Keep your client details in one place.",
    description:
      "Organise customer contact and billing details alongside your invoicing workflow.",
    detail: "Less searching. More clarity.",
  },
];

const STEPS = [
  {
    image: "/images/homepage/S3one.jpg",
    imageAlt: "Professional creating an invoice on a laptop",
    title: "Create your invoice",
    description:
      "Choose a client, add your items, and set payment details.",
    label: "Ready to share",
  },
  {
    image: "/images/homepage/S3two.jpg",
    imageAlt: "Business owner sharing an invoice using a smartphone",
    title: "Share through WhatsApp",
    description:
      "Open a prefilled message containing the invoice link, then send it to your customer.",
    label: "A familiar conversation",
  },
  {
    image: "/images/homepage/S3three.jpg",
    imageAlt: "Professional reviewing business payment records",
    title: "Track and follow up",
    description:
      "Record payments, check outstanding balances, and send reminders.",
    label: "Your balances in view",
  },
];

const AUDIENCES = [
  {
    icon: FileText,
    title: "Freelancers",
    description:
      "Invoice clients for projects and track outstanding payments.",
    tag: "Projects → invoices",
  },
  {
    icon: Users,
    title: "Agencies & consultants",
    description:
      "Keep client billing and payment records organised.",
    tag: "Clients → clarity",
  },
  {
    icon: Wallet,
    title: "Service providers",
    description:
      "Share invoices for completed work and follow up on balances.",
    tag: "Work → payment records",
  },
  {
    icon: MessageCircle,
    title: "Small businesses",
    description:
      "Manage customer invoices and full or partial payments in one place.",
    tag: "Everyday billing, organised",
  },
];

const FAQS = [
  {
    question: "Do I need WhatsApp Business to use InvoPing?",
    answer:
      "No. Invoice sharing uses WhatsApp click-to-chat links, which work with WhatsApp and WhatsApp Business. You review and send the prefilled message yourself.",
  },
  {
    question: "Do customers need an account to view invoices?",
    answer:
      "No. Customers can open the invoice link you share to view the invoice and its payment instructions without creating an InvoPing account.",
  },
  {
    question: "Can I download invoices as PDFs?",
    answer:
      "Yes. You can download professional PDF invoices for your records or share them with customers.",
  },
  {
    question: "Can I record partial payments?",
    answer:
      "Yes. You can record full or partial payments against an invoice. InvoPing updates the amount paid and remaining balance.",
  },
  {
    question: "Does InvoPing automatically send WhatsApp messages?",
    answer:
      "WhatsApp sharing uses click-to-chat. InvoPing prepares a message containing the invoice link, and you review and send it in WhatsApp.",
  },
  {
    question: "How do I create an account and sign in?",
    answer:
      "Use Get Started Free to create an account or Sign In to access an existing account. Customer access uses an email verification code rather than a password.",
  },
];

function PlatformLogo({
  inverse = false,
}: {
  inverse?: boolean;
}) {
  return <BrandLogo variant={inverse ? "dark" : "light"} />;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
  alignLeft = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
  alignLeft?: boolean;
}) {
  return (
    <div
      className={`mb-9 max-w-[760px] md:mb-12 ${
        alignLeft
          ? "text-center md:text-left"
          : "mx-auto text-center"
      }`}
    >
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[9px] font-bold tracking-[0.12em] md:text-[10px] ${
          light
            ? "border border-white/15 bg-white/10 text-[#d6efdf]"
            : "bg-[#e7f2e9] text-[#147d39]"
        }`}
      >
        <span aria-hidden="true">+</span>
        {eyebrow}
      </span>

      <h2
        className={`mt-5 text-[33px] font-semibold leading-[1.14] tracking-[-0.045em] md:text-[clamp(33px,3.5vw,49px)] ${
          light ? "text-white" : "text-[#103f2f]"
        }`}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`mt-4 max-w-[590px] text-sm leading-8 md:text-base ${
            alignLeft ? "" : "mx-auto"
          } ${light ? "text-[#c1d8ca]" : "text-[#66766e]"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function Wave({
  dark = false,
  reverse = false,
}: {
  dark?: boolean;
  reverse?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`-mb-px h-9 md:h-16 ${
        dark ? "bg-[#f3f8f4]" : reverse ? "bg-[#064b32]" : "bg-white"
      }`}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className={`block h-full w-full ${reverse ? "-scale-x-100" : ""}`}
      >
        <path
          fill={dark ? "#064b32" : "#f3f8f4"}
          d="M0,42 C190,2 350,12 540,32 C770,58 900,4 1100,14 C1230,20 1340,38 1440,12 L1440,80 L0,80 Z"
        />
      </svg>
    </div>
  );
}

function MobileMenuDots({ spinning = false }: { spinning?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block h-6 w-6 ${
        spinning
          ? "animate-spin motion-reduce:animate-none"
          : ""
      }`}
      style={{ animationDuration: "900ms" }}
    >
      {Array.from({ length: 9 }, (_, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);

        // The centre dot disappears when forming the circle.
        const ringIndex = index < 4 ? index : index - 1;
        const angle = (ringIndex / 8) * Math.PI * 2 - Math.PI / 2;

        const x = spinning
          ? Math.cos(angle) * 9
          : (column - 1) * 8;

        const y = spinning
          ? Math.sin(angle) * 9
          : (row - 1) * 8;

        return (
          <span
            key={index}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-current transition-[transform,opacity] duration-300 ease-in-out motion-reduce:transition-none"
            style={{
              opacity: spinning && index === 4 ? 0 : 1,
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            }}
          />
        );
      })}
    </span>
  );
}

function Navigation() {
  const [open, setOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pendingSectionRef = useRef<string | null>(null);

  // Stop the opening dots animation.
  useEffect(() => {
    if (!open) {
      setMenuAnimating(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setMenuAnimating(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [open]);


// Disable background scrolling without moving the homepage.
useEffect(() => {
  if (!open) return;

  const html = document.documentElement;

  const previousOverflow = html.style.overflow;
  const previousOverscroll = html.style.overscrollBehavior;

  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";

  return () => {
    html.style.overflow = previousOverflow;
    html.style.overscrollBehavior = previousOverscroll;
  };
}, [open]);

  // Navigate only after the menu closes and scrolling is unlocked.
  useEffect(() => {
    if (open || !pendingSectionRef.current) return;

    const href = pendingSectionRef.current;

    const frame = window.requestAnimationFrame(() => {
      pendingSectionRef.current = null;

      const section = document.getElementById(href.slice(1));
      if (!section) return;

      window.history.replaceState(null, "", href);

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      section.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  // Focus the menu without scrolling the page.
  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus({ preventScroll: true });
      }

      // Keep keyboard focus inside the open menu.
      if (event.key === "Tab") {
        const panel = document.getElementById("mobile-navigation");

        const elements = panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );

        if (!elements?.length) return;

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Close the mobile menu when switching to desktop.
  useEffect(() => {
    const desktopQuery = window.matchMedia(
      "(min-width: 1200px)"
    );

    const handleScreenChange = () => {
      if (desktopQuery.matches) {
        setOpen(false);
      }
    };

    desktopQuery.addEventListener("change", handleScreenChange);

    return () => {
      desktopQuery.removeEventListener(
        "change",
        handleScreenChange
      );
    };
  }, []);

  function openMenu() {
    pendingSectionRef.current = null;
    setMenuAnimating(true);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    menuButtonRef.current?.focus({ preventScroll: true });
  }

  function navigateToSection(href: string) {
    pendingSectionRef.current = href;
    closeMenu();
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#e6eee8] bg-white/95">
        <div className="mx-auto flex min-h-[72px] w-[calc(100%-40px)] max-w-[1440px] items-center justify-between gap-6 md:min-h-[84px] md:w-[calc(100%-64px)]">
          <PlatformLogo />

          {/* Desktop navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-5 text-[13px] font-semibold min-[1200px]:flex"
          >
            {NAVIGATION.map((item) => (
              <a
                href={item.href}
                key={item.href}
                className="whitespace-nowrap hover:text-[#079333]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop account actions */}
          <div className="hidden shrink-0 items-center gap-5 min-[1200px]:flex">
            <Link
              href="/sign-in"
              className="text-[13px] font-semibold hover:text-[#079333]"
            >
              Sign In
            </Link>

            <Link
              href="/sign-up"
              className={`${GREEN_BUTTON} !min-h-11 !px-4 !py-3 !text-xs`}
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={openMenu}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#deeadf] bg-white text-[#064b32] outline-none ring-0 [-webkit-tap-highlight-color:transparent] focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#079333] focus-visible:ring-offset-2 min-[1200px]:hidden"
          >
            <MobileMenuDots spinning={menuAnimating} />
          </button>
        </div>
      </header>

      {/* Transparent blur over the homepage */}
      <div
        aria-hidden="true"
        onClick={closeMenu}
        onTouchMove={(event) => event.preventDefault()}
        className={`fixed inset-0 z-[70] touch-none bg-white/10 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none min-[1200px]:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Right-side mobile navigation panel */}
<nav
  id="mobile-navigation"
  aria-label="Mobile navigation"
  aria-hidden={!open}
  inert={!open}
  className={`fixed inset-y-0 right-0 z-[80] flex h-[100dvh] w-[85vw] max-w-[380px] flex-col overflow-y-auto overscroll-contain rounded-l-[26px] bg-white text-[#103f2f] shadow-[-16px_0_50px_rgba(6,60,41,0.15)] transition-transform duration-500 ease-out motion-reduce:transition-none min-[1200px]:hidden ${
    open
      ? "translate-x-0"
      : "pointer-events-none translate-x-full"
  }`}
>
        {/* Panel header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#edf2ed] px-5 pb-5 pt-[max(20px,env(safe-area-inset-top))]">
          <PlatformLogo />

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close navigation"
            onClick={closeMenu}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f0f6f1] text-[#064b32] transition-colors hover:bg-[#e1eee4]"
          >
            {menuAnimating ? (
              <MobileMenuDots spinning />
            ) : (
              <X size={21} />
            )}
          </button>
        </div>

        {/* Navigation links */}
        <div className="px-5 py-3">
          {NAVIGATION.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => {
                if (item.href.startsWith("#")) {
                  event.preventDefault();
                  navigateToSection(item.href);
                } else {
                  closeMenu();
                }
              }}
              className="flex min-h-[58px] items-center justify-between gap-3 border-b border-[#f0f4f0] py-4 text-sm font-semibold transition-colors hover:text-[#079333]"
            >
              {item.label}

              <ArrowRight
                size={16}
                className="shrink-0 text-[#079333]"
              />
            </a>
          ))}
        </div>

        {/* Account actions */}
        <div className="mt-auto px-5 pt-10 pb-[max(24px,env(safe-area-inset-bottom))]">
          <div className="grid gap-3">
            <Link
              href="/sign-in"
              onClick={closeMenu}
              className={`${OUTLINE_BUTTON} w-full`}
            >
              Sign In
            </Link>

            <Link
              href="/sign-up"
              onClick={closeMenu}
              className={`${GREEN_BUTTON} w-full`}
            >
              Get Started Free
              <ArrowRight size={17} />
            </Link>
          </div>


        </div>
      </nav>
    </>
  );
}

function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  // Start at the top whenever the homepage loads.
useEffect(() => {
  const previousRestoration = window.history.scrollRestoration;
  window.history.scrollRestoration = "manual";

  const scrollToTop = () => {
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;

    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.style.scrollBehavior = previousBehavior;
  };

  scrollToTop();

  // Also handle a page restored from the browser's back/forward cache.
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) scrollToTop();
  };

  window.addEventListener("pageshow", handlePageShow);

  return () => {
    window.history.scrollRestoration = previousRestoration;
    window.removeEventListener("pageshow", handlePageShow);
  };
}, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const desktop = window.matchMedia("(min-width: 768px)");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let frame = 0;

    const update = () => {
      frame = 0;

      const progress =
        desktop.matches && !reducedMotion.matches
          ? Math.min(Math.max(window.scrollY / 480, 0), 1)
          : 0;

      section.style.setProperty("--hero-inset", `${progress * 4.5}%`);
      section.style.setProperty("--hero-radius", `${progress * 36}px`);
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotion.addEventListener("change", requestUpdate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-white md:px-[var(--hero-inset,0%)]"
    >
      <div className="relative isolate flex flex-col overflow-hidden bg-white px-5 pb-8 md:min-h-[760px] md:justify-center md:rounded-[var(--hero-radius,0px)] md:bg-[#083e2b] md:px-0 md:pb-0">
        {/* Temporary media panel. Final image/video will replace this. */}
        <div className="relative order-2 aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#062f23] to-[#0c5a3c] md:absolute md:inset-0 md:order-none md:aspect-auto md:h-full md:rounded-none">
          <div className="absolute -right-20 -top-10 h-[550px] w-[550px] rounded-full border border-[#b7ecc4]/15" />
          <div className="absolute right-0 top-10 h-[390px] w-[390px] rounded-full border border-[#b7ecc4]/15" />

          <div className="absolute right-[23%] top-[13%] w-[56%] max-w-[310px] rotate-[8deg] rounded-2xl border border-[#d6e8db] bg-[#f4faf5] p-6 text-[#145034] shadow-2xl md:right-[9%] md:top-[24%] md:w-[280px]">
            <div className="mb-8 flex items-center justify-between">
              <FileText size={23} />
              <span className="text-[10px] font-bold tracking-widest">
                INVOICE
              </span>
              <CheckCircle2 size={21} />
            </div>

            <div className="mb-3 h-2 w-full rounded-full bg-[#dbe9df]" />
            <div className="mb-6 h-2 w-1/2 rounded-full bg-[#dbe9df]" />
            <div className="mb-6 border-t border-[#dbe9df]" />
            <div className="mb-3 h-2 w-full rounded-full bg-[#dbe9df]" />
            <div className="mb-3 h-2 w-3/4 rounded-full bg-[#dbe9df]" />
            <div className="mb-8 h-2 w-1/2 rounded-full bg-[#dbe9df]" />

            <div className="flex items-center justify-between gap-2 text-[9px] font-semibold">
              Made for your business
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="absolute bottom-[15%] right-[7%] flex -rotate-[4deg] items-center gap-3 rounded-2xl rounded-br-sm bg-[#d5f6df] p-4 text-[10px] text-[#175235] shadow-xl md:bottom-[20%] md:right-[5%] md:p-5 md:text-sm">
            <MessageCircle size={22} />
            From invoice to conversation.
          </div>


          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/55 via-black/20 to-transparent md:block" />
        </div>

        <div className={`${CONTAINER} relative z-10 order-1 py-11 text-center md:order-none md:py-20 md:text-left`}>

          <h1 className="text-[clamp(37px,8.7vw,59px)] font-semibold leading-[1.05] tracking-[-0.055em] text-[#103f2f] md:text-[clamp(48px,5.2vw,76px)] md:text-white">
            Send invoices
            <br />
            on WhatsApp.
            <br />
            <span className="text-[#238343] md:text-[#b8edc6]">
              Stay on top
              <br />
              of payments.
            </span>
          </h1>

<p className="mx-auto mt-6 max-w-[470px] text-[13px] font-bold leading-7 text-[#6b7b71] md:mx-0 md:text-base md:leading-8 md:text-[#e0eae2]">
  Create and share invoices via WhatsApp, send reminders, and track payments, all in one place.
</p>
<div className="mx-auto mt-8 flex w-full max-w-[470px] flex-row items-stretch gap-2 md:mx-0 md:gap-3">
  <a
    href="#pricing"
    className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl bg-[#079333] px-2 py-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#067b2b] sm:gap-2 sm:text-sm"
  >
    <span className="whitespace-nowrap">
      See Plans &amp; Pricing
    </span>
    <ArrowRight size={16} className="shrink-0" />
  </a>

  <a
    href="#how-it-works"
    className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-[#d5e2d8] bg-white px-2 py-3 text-[11px] font-semibold text-[#064b32] transition-colors hover:bg-[#f3f8f4] sm:gap-2 sm:text-sm"
  >
    <span className="whitespace-nowrap">
      See How It Works
    </span>
               <ArrowDown size={16} className="shrink-0" />
          </a>
        </div>
        </div>

        <span className="absolute bottom-6 left-14 hidden text-[9px] tracking-[0.18em] text-[#b3c7bb] md:block">
          YOUR BUSINESS. YOUR INVOICES. A CLEARER VIEW.
        </span>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: FileText, label: "Professional PDF invoices" },
    { icon: MessageCircle, label: "WhatsApp & WhatsApp Business" },
    {
      icon: CheckCircle2,
      label: "No customer account needed to view invoices",
    },
  ];

  return (
    <section
      aria-label="Product benefits"
      className="border-b border-[#e6eee7] bg-[#f3f8f4]"
    >
      <div className={`${CONTAINER} flex flex-col items-start justify-center gap-4 py-7 md:min-h-24 md:flex-row md:items-center md:justify-between`}>
        {items.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-2.5 text-xs font-medium"
          >
            <Icon size={19} className="shrink-0 text-[#079333]" />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

function SlideUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (
      motionQuery.matches ||
      !("IntersectionObserver" in window)
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(element);

    const handleMotionChange = () => {
      if (motionQuery.matches) {
        setVisible(true);
        observer.disconnect();
      }
    };

    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      observer.disconnect();
      motionQuery.removeEventListener(
        "change",
        handleMotionChange
      );
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      } ${className}`}
      style={{
        transitionDelay: visible ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}

function SolutionsSection() {
  return (
    <section
      id="features"
      className="bg-white py-16 md:py-24"
    >
      <div className={CONTAINER}>
        {/* Slide-up animation for the heading and subtext */}
        <SlideUp>
          <SectionHeading
            eyebrow="LESS FRICTION. MORE CLARITY."
            title="The smarter way to manage your invoicing."
            description="Bring the everyday pieces of billing together, from the first invoice to the remaining balance."
          />
        </SlideUp>

        <div className="grid gap-5 md:grid-cols-2">
          {SOLUTIONS.map(({ icon: Icon, ...item }, index) => (
            <SlideUp
              key={item.title}
              delay={(index % 2) * 120}
              className="h-full"
            >
              <article
                className="relative isolate flex h-full min-h-[480px] flex-col justify-end overflow-hidden rounded-[24px] bg-[#e7f2e9] md:min-h-[500px]"
              >
                {/* Photograph fills the whole card */}
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1244px) 50vw, 580px"
                  className="-z-20 object-cover object-center"
                />

                {/* Card icon */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 md:p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/95 text-[#13813d] shadow-sm">
                    <Icon size={23} />
                  </span>
                </div>

                {/* Text overlays the lower part */}
                <div className="relative mt-40 px-6 pb-4 pt-6 md:mt-[88px] md:px-4 md:pb-4">
                  {/* Greenish-white fade */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 top-8 -z-10 bg-gradient-to-t from-[#f3f8f4]/95 via-[#f3f8f4]/75 to-transparent"
                  />

                  <p className="mb-2 text-xs leading-5 text-black">
                    {item.problem}
                  </p>

                  <h3 className="max-w-[430px] text-[23px] font-semibold leading-tight tracking-[-0.035em] text-[#103f2f] md:text-[27px]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-[13px] leading-6 text-[#425e4d]">
                    {item.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-[#103f2f]/15 pt-4 text-[11px] font-semibold text-[#167638]">
                    <CheckCircle2
                      size={16}
                      className="shrink-0"
                    />
                    {item.detail}
                  </div>
                </div>
              </article>
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  );
}


function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="bg-[#f3f8f4] py-16 md:py-24"
    >
      <div className={CONTAINER}>
        <SlideUp>
          <SectionHeading
            eyebrow="HOW IT WORKS"
            title="From invoice to follow-up in three simple steps."
            description="A straightforward workflow that fits the way you already do business."
          />
        </SlideUp>

        <div className="grid gap-0 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <SlideUp
              key={step.title}
              delay={index * 120}
              className="relative min-w-0"
            >
              <article>
                <div className="relative">
                  {/* Step image */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#e0f2e5]">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1244px) 33vw, 380px"
                      className="object-cover object-center"
                    />

                    {/* Step number */}
                    <span className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[#def3e2] text-sm font-semibold text-[#064b32] shadow-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* Benefit label */}
                    <span className="absolute bottom-4 left-4 right-4 flex w-fit max-w-[calc(100%-32px)] items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-medium text-[#103f2f] shadow-sm">
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-[#079333]"
                      />
                      {step.label}
                    </span>
                  </div>

                  {/* Desktop arrow connecting to the next image */}
                  {index < STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 top-1/2 hidden w-10 -translate-y-1/2 items-center text-[#079333] md:flex"
                    >
                      <span className="h-0.5 flex-1 bg-[#079333]" />

                      <ArrowRight
                        size={22}
                        strokeWidth={2}
                        className="-ml-1 shrink-0"
                      />
                    </div>
                  )}
                </div>

                {/* Step text */}
                <h3 className="mt-6 text-[23px] font-semibold leading-tight tracking-[-0.035em] text-[#103f2f]">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#66766e]">
                  {step.description}
                </p>

                {/* Mobile arrow connecting to the next step */}
                {index < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="flex justify-center py-7 text-[#079333] md:hidden"
                  >
                    <ArrowDown
                      size={28}
                      strokeWidth={1.8}
                    />
                  </div>
                )}
              </article>
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function InvoiceReference() {
  return (
    <div className="rounded-2xl bg-white p-6 text-[#103f2f]">
      <div className="mb-5 flex items-center justify-between text-[#649073]">
        <span className="text-[9px] font-semibold tracking-[0.13em]">
          SAMPLE INVOICE
        </span>
        <FileText size={22} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] text-[#8a978e]">Invoice number</p>
          <strong className="mt-1 block text-lg">INV-001</strong>
        </div>

        <span className="rounded-full bg-[#edf5e9] px-2.5 py-2 text-[9px] font-semibold text-[#57763d]">
          Partially paid
        </span>
      </div>

      <div className="my-5">
        <p className="text-[9px] text-[#8a978e]">Billed to</p>
        <strong className="mt-1 block text-xs">Sample Client</strong>
      </div>

      <div className="flex justify-between border-t border-[#edf1ed] py-3 text-xs">
        <span className="text-[#76877a]">Design services</span>
        <strong>$500.00</strong>
      </div>

      <div className="flex justify-between border-t border-[#edf1ed] py-3 text-xs">
        <span className="text-[#76877a]">Payment recorded</span>
        <strong className="text-[#148a3d]">$100.00</strong>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f1f7f0] p-4 text-xs">
        <span>Balance due</span>
        <strong className="text-2xl tracking-tight">$400.00</strong>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[9px] text-[#7d9382]">
        <CheckCircle2 size={15} />
        Illustrative product reference
      </p>
    </div>
  );
}

function SpotlightSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const reminderRef = useRef<HTMLDivElement>(null);
const invoiceRef = useRef<HTMLDivElement>(null);

const [isMobile, setIsMobile] = useState(false);
const [reminderVisible, setReminderVisible] = useState(false);
const [invoiceVisible, setInvoiceVisible] = useState(false);
const [invoiceDetailsVisible, setInvoiceDetailsVisible] =
  useState(false);
  const [chatStage, setChatStage] = useState(0);
  const chatStarted = stage >= 1;

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const timers: ReturnType<typeof setTimeout>[] = [];
    let started = false;

    const clearTimers = () => {
      timers.forEach((timer) => clearTimeout(timer));
    };

    const showCompleted = () => {
      clearTimers();
      setStage(5);
    };

    if (
      motionQuery.matches ||
      !("IntersectionObserver" in window)
    ) {
      showCompleted();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;

        started = true;
        observer.disconnect();

        setStage(1);

        const sequence = [
          { delay: 700, stage: 2 },
          { delay: 1400, stage: 3 },
          { delay: 2100, stage: 4 },
          { delay: 2800, stage: 5 },
        ];

        sequence.forEach((step) => {
          timers.push(
            setTimeout(() => {
              setStage(step.stage);
            }, step.delay)
          );
        });
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(section);

    const handleMotionChange = () => {
      if (motionQuery.matches) {
        observer.disconnect();
        showCompleted();
      }
    };

    motionQuery.addEventListener(
      "change",
      handleMotionChange
    );

    return () => {
      observer.disconnect();
      clearTimers();

      motionQuery.removeEventListener(
        "change",
        handleMotionChange
      );
    };
  }, []);

  useEffect(() => {
  if (!chatStarted) return;

  const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const schedule = (callback: () => void, delay: number) => {
    timer = setTimeout(() => {
      if (!stopped) callback();
    }, delay);
  };

  const startLoop = () => {
    // Show the first message.
    setChatStage(1);

    schedule(() => {
      // Show the customer reply.
      setChatStage(2);

      schedule(() => {
        // Reset after the reply animation + two-second pause.
        setChatStage(0);

        schedule(startLoop, 150);
      }, 3500);
    }, 1800);
  };

  const updateMotionPreference = () => {
    if (timer) clearTimeout(timer);

    if (motionQuery.matches) {
      setChatStage(2);
    } else {
      startLoop();
    }
  };

  updateMotionPreference();

  motionQuery.addEventListener(
    "change",
    updateMotionPreference
  );

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);

    motionQuery.removeEventListener(
      "change",
      updateMotionPreference
    );
  };
}, [chatStarted]);

function chatAnimationClass(requiredStage: number) {
  const visible = chatStage >= requiredStage;

  return [
    "motion-reduce:transform-none",
    "motion-reduce:opacity-100",
    "motion-reduce:transition-none",
    chatStage === 0
      ? "transition-none"
      : "transition-[opacity,transform] duration-[1500ms] ease-out",
    visible
      ? "translate-y-0 opacity-100"
      : "translate-y-5 opacity-0",
  ].join(" ");
}


useEffect(() => {
  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let observer: IntersectionObserver | undefined;
  let detailsTimer: ReturnType<typeof setTimeout> | undefined;

  const setup = () => {
    observer?.disconnect();

    if (detailsTimer) clearTimeout(detailsTimer);

    setIsMobile(mobileQuery.matches);

    if (!mobileQuery.matches) return;

    if (
      motionQuery.matches ||
      !("IntersectionObserver" in window)
    ) {
      setReminderVisible(true);
      setInvoiceVisible(true);
      setInvoiceDetailsVisible(true);
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          if (entry.target === reminderRef.current) {
            setReminderVisible(true);
          }

          if (entry.target === invoiceRef.current) {
            setInvoiceVisible(true);

            detailsTimer = setTimeout(() => {
              setInvoiceDetailsVisible(true);
            }, 700);
          }

          observer?.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
      }
    );

    if (reminderRef.current) {
      observer.observe(reminderRef.current);
    }

    if (invoiceRef.current) {
      observer.observe(invoiceRef.current);
    }
  };

  setup();

  mobileQuery.addEventListener("change", setup);
  motionQuery.addEventListener("change", setup);

  return () => {
    observer?.disconnect();

    if (detailsTimer) clearTimeout(detailsTimer);

    mobileQuery.removeEventListener("change", setup);
    motionQuery.removeEventListener("change", setup);
  };
}, []);

function animationClass(requiredStage: number) {
  let visible = stage >= requiredStage;

  if (isMobile) {
    if (requiredStage === 3) {
      visible = reminderVisible;
    } else if (requiredStage === 4) {
      visible = invoiceVisible;
    } else if (requiredStage === 5) {
      visible = invoiceDetailsVisible;
    }
  }

  return [
    "transition-[opacity,transform]",
    "duration-700 ease-out",
    "motion-reduce:transform-none",
    "motion-reduce:opacity-100",
    "motion-reduce:transition-none",
    visible
      ? "translate-y-0 opacity-100"
      : "translate-y-5 opacity-0",
  ].join(" ");
}

  return (
    <section
      ref={sectionRef}
      className="bg-[#064b32] py-16 text-white md:py-24"
    >
      <div className={CONTAINER}>
        <SlideUp>
          <SectionHeading
            eyebrow="SHARE. FOLLOW UP. TRACK."
            title="From invoice to payment, stay in control."
            description="Keep the conversation familiar and your payment records organised."
            light
          />
        </SlideUp>

        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
          {/* WhatsApp conversation */}
          <div className="overflow-hidden rounded-3xl border-[6px] border-white/15 bg-[#fafdfb] text-[#103f2f] shadow-2xl shadow-black/10">
            <div className="flex items-center gap-3 border-b border-[#e4ece5] bg-white p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#def1e3] text-xs font-semibold text-[#2c7042]">
                SC
              </span>

              <div className="flex-1">
                <strong className="block text-[13px]">
                  Sample Client
                </strong>

                <span className="mt-1 block text-[9px] text-[#77877c]">
                  Illustrative WhatsApp conversation
                </span>
              </div>

              <MessageCircle
                size={23}
                className="text-[#33854b]"
              />
            </div>

            <div className="flex min-h-[365px] flex-col items-end bg-[#eaf1e8] p-5 md:p-6">
              <span className="mb-6 self-center rounded-lg bg-[#f6faf4] px-3 py-2 text-[8px] tracking-widest text-[#6f7c71]">
                INVOICE SHARING EXAMPLE
              </span>

              {/* First: invoice message */}
              <div
                className={`w-[95%] rounded-2xl rounded-tr-sm bg-[#d7f6cf] p-4 ${chatAnimationClass(1)}`}
              >
                <p className="text-xs leading-6 text-[#28452e]">
                  Hi! Here’s the invoice for your design project.
                  You can view the details and payment instructions
                  using the link below.
                </p>

                <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-white/65 p-3">
                  <FileText
                    size={24}
                    className="shrink-0 text-[#278b43]"
                  />

                  <div className="flex-1">
                    <strong className="block text-[11px]">
                      Invoice INV-001
                    </strong>

                    <span className="mt-1 block text-[9px] text-[#63806a]">
                      View invoice and payment details
                    </span>
                  </div>

                  <ArrowRight size={17} />
                </div>

                <span className="mt-3 flex items-center justify-end gap-1.5 text-[8px] text-[#628368]">
                  Sample message
                  <Check size={12} />
                </span>
              </div>

              {/* Second: customer reply */}
              <div
                className={`mt-5 self-start rounded-xl rounded-tl-sm bg-white px-4 py-3 text-xs ${chatAnimationClass(2)}`}
              >
                Thank you. I’ll check it now.
              </div>
            </div>

            <p className="px-5 py-4 text-center text-[10px] leading-6 text-[#6d7f72]">
              You review and send the prefilled message in WhatsApp.
            </p>
          </div>

          {/* Reminder and invoice */}
          <div className="grid gap-5">
            <div className="flex gap-4 pb-2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#a7e5b6]">
                <Send size={22} />
              </span>

              <div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Share where conversations happen.
                </h3>

                <p className="mt-2 text-[13px] leading-7 text-[#c3dacb]">
                  Send an invoice link your customer can open
                  without creating an account.
                </p>
              </div>
            </div>

            {/* Third: reminder notification */}
            <div
  ref={reminderRef}
  className={`flex items-center gap-3 rounded-2xl bg-[#f6fbf7] p-5 text-[#103f2f] ${animationClass(3)}`}
>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e9f4eb] text-[#13813d]">
                <BellRing size={21} />
              </span>

              <div>
                <strong className="text-xs">
                  Keep follow-ups organised
                </strong>

                <p className="mt-1 text-[10px] leading-6 text-[#66766e]">
                  Send a reminder about an outstanding balance.
                </p>
              </div>
            </div>

            {/* Fourth: invoice reference */}
<div
  ref={invoiceRef}
  className={`rounded-2xl bg-white p-6 text-[#103f2f] ${animationClass(4)}`}
>
              <div className="mb-5 flex items-center justify-between text-[#649073]">
                <span className="text-[9px] font-semibold tracking-[0.13em]">
                  SAMPLE INVOICE
                </span>

                <FileText size={22} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] text-[#8a978e]">
                    Invoice number
                  </p>

                  <strong className="mt-1 block text-lg">
                    INV-001
                  </strong>
                </div>

                {/* Fifth: payment status */}
                <span
                  className={`rounded-full bg-[#edf5e9] px-2.5 py-2 text-[9px] font-semibold text-[#57763d] ${animationClass(5)}`}
                >
                  Partially paid
                </span>
              </div>

              <div className="my-5">
                <p className="text-[9px] text-[#8a978e]">
                  Billed to
                </p>

                <strong className="mt-1 block text-xs">
                  Sample Client
                </strong>
              </div>

              <div className="flex justify-between border-t border-[#edf1ed] py-3 text-xs">
                <span className="text-[#76877a]">
                  Design services
                </span>

                <strong>$500.00</strong>
              </div>

              <div className="flex justify-between border-t border-[#edf1ed] py-3 text-xs">
                <span className="text-[#76877a]">
                  Payment recorded
                </span>

                <strong className="text-[#148a3d]">
                  $100.00
                </strong>
              </div>

              {/* Fifth: outstanding balance */}
              <div
                className={`mt-3 flex items-center justify-between rounded-xl bg-[#f1f7f0] p-4 text-xs ${animationClass(5)}`}
              >
                <span>Balance due</span>

                <strong className="text-2xl tracking-tight">
                  $400.00
                </strong>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-[9px] text-[#7d9382]">
                <CheckCircle2 size={15} />
                Illustrative product reference
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-5 border-t border-white/15 pt-7 text-[11px] text-[#cce2d3] md:gap-8">
          {[
            "Full and partial payment records",
            "Outstanding balances",
            "Financial analytics",
          ].map((label) => (
            <span
              key={label}
              className="flex items-center gap-2"
            >
              <CheckCircle2 size={17} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section
      id="who-its-for"
      className="bg-[#f3f8f4] py-16 md:py-24"
    >
      <div className={CONTAINER}>
        {/* Static heading and description */}
        <SectionHeading
          eyebrow="MADE FOR YOUR WORKDAY"
          title="For businesses that keep business moving on WhatsApp."
          description="Whether you work independently or manage a growing business, keep your billing in order."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {AUDIENCES.map(({ icon: Icon, ...audience }, index) => (
            <SlideUp
              key={audience.title}
              delay={(index % 2) * 120}
              className="h-full"
            >
              <article className="flex h-full items-start gap-4 rounded-[18px] border border-[#e0eae1] bg-white p-6 md:gap-5 md:p-8">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#edf6ee] text-[#13813d]">
                  <Icon size={25} />
                </span>

                <div>
                  <span className="text-[9px] tracking-wide text-[#5c946d]">
                    {audience.tag}
                  </span>

                  <h3 className="mt-2 text-xl font-semibold tracking-tight">
                    {audience.title}
                  </h3>

                  <p className="mt-2.5 text-[13px] leading-7 text-[#66766e]">
                    {audience.description}
                  </p>
                </div>
              </article>
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [selectedPlan, setSelectedPlan] =
    useState<PlanTier>("STARTER");

  return (
    <section id="pricing" className="bg-white py-16 md:py-24">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="PLANS & PRICING"
          title="Simple pricing. Room to grow."
          description="Start free and choose a plan that fits your business."
        />

        <div className="mx-auto grid max-w-[430px] gap-5 md:max-w-none md:grid-cols-3">
          {Object.values(PLANS).map((plan) => {
            const selected = selectedPlan === plan.id;

            const features = [
              {
                label: `${
                  plan.monthlyInvoiceLimit === Infinity
                    ? "Unlimited"
                    : plan.monthlyInvoiceLimit
                } invoices per month`,
                included: true,
              },
              {
                label: `${
                  plan.maxClients === Infinity
                    ? "Unlimited"
                    : plan.maxClients
                } clients`,
                included: true,
              },
              { label: "Professional PDF invoices", included: true },
              { label: "WhatsApp invoice sharing", included: true },
              {
                label: "Custom business logo",
                included: plan.features.customLogo,
              },
              {
                label: "Remove InvoPing branding",
                included: plan.features.removeBranding,
              },
              {
                label: "Custom reminder templates",
                included: plan.features.customTemplates,
              },
              {
                label: "Advanced analytics",
                included: plan.features.advancedAnalytics,
              },
              {
                label: "Data export",
                included: plan.features.dataExport,
              },
            ];

            return (
<article
  key={plan.id}
  onClick={() => setSelectedPlan(plan.id)}
  className={`relative cursor-pointer rounded-[21px] border-2 p-7 transition-colors motion-reduce:transition-none focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-4 ${
                  selected
                    ? "border-[#168a40] bg-gradient-to-b from-[#f0f8f0] to-white shadow-xl shadow-green-900/5"
                    : "border-[#dce7df] bg-white"
                }`}
              >
                <label className="absolute inset-0 z-10 cursor-pointer rounded-[21px]">
  <input
    type="radio"
    name="homepage-plan"
    value={plan.id}
    checked={selected}
    onChange={() => setSelectedPlan(plan.id)}
    aria-label={`Select ${plan.name} plan`}
    className="sr-only"
  />
</label>
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <h3 className="text-[22px] font-semibold tracking-tight">
                    {plan.name}
                  </h3>

                  {plan.badgeText && (
                    <span className="rounded-full bg-[#dff0df] px-2.5 py-1.5 text-[9px] font-semibold text-[#1d7438]">
                      {plan.badgeText}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs leading-6 text-[#66766e] md:min-h-[72px]">
                  {plan.description}
                </p>

                <div className="mb-6 mt-5 flex items-baseline gap-2">
                  <strong className="text-[53px] font-semibold leading-none tracking-[-0.06em]">
                    ${plan.price}
                  </strong>
                  <span className="text-[10px] text-[#74867a]">
                    USD / month
                  </span>
                </div>

                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Choose ${plan.name} plan`}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full ${
                    selected ? GREEN_BUTTON : OUTLINE_BUTTON
                  }`}
                >
                  Choose Plan
                  {selected ? <Check size={17} /> : <ArrowRight size={17} />}
                </button>

                <div className="my-6 border-t border-[#e6eee7]" />

                <ul className="space-y-4">
                  {features.map((feature) => (
                    <li
                      key={feature.label}
                      className={`flex items-start gap-2.5 text-xs leading-5 ${
                        feature.included ? "text-[#41604b]" : "text-[#89958e]"
                      }`}
                    >
                      {feature.included ? (
                        <Check size={17} className="shrink-0 text-[#15903c]" />
                      ) : (
                        <Minus size={17} className="shrink-0 text-[#a5afa8]" />
                      )}

                      <span>
                        {feature.label}
                        {!feature.included && (
                          <span className="sr-only"> — not included</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-5">
          <p aria-live="polite" aria-atomic="true" className="text-sm text-[#66766e]">
            Selected plan:{" "}
            <strong className="text-[#064b32]">
              {PLANS[selectedPlan].name}
            </strong>
          </p>

          <Link href="/sign-up" className={GREEN_BUTTON}>
            Continue to Sign Up
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="bg-[#f3f8f4] py-16 md:py-24"
    >
      <div
        className={`${CONTAINER} grid items-start gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-12 lg:gap-20`}
      >
        {/* Static heading and description */}
        <div className="text-center md:text-left">
          <SectionHeading
            eyebrow="A LITTLE MORE CLARITY"
            title="Questions? Let’s clear them up."
            description="A few practical things to know before your first invoice."
            alignLeft
          />

          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1b8040]"
          >
            Contact information
            <ArrowRight size={17} />
          </a>
        </div>

        <div className="grid gap-3">
          {FAQS.map((faq, index) => {
            const isOpen = openQuestion === index;
            const questionId = `faq-question-${index}`;
            const answerId = `faq-answer-${index}`;

            return (
              <SlideUp
                key={faq.question}
                delay={80}
              >
                <div className="overflow-hidden rounded-xl border border-[#dce8df] bg-white">
                  <h3>
                    <button
                      id={questionId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => {
                        setOpenQuestion((current) =>
                          current === index ? null : index
                        );
                      }}
                      className="flex min-h-[72px] w-full items-center justify-between gap-5 px-5 py-4 text-left text-[13px] font-semibold text-[#103f2f] transition-colors hover:bg-[#f7fbf7] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-600"
                    >
                      <span>{faq.question}</span>

                      {isOpen ? (
                        <Minus
                          size={19}
                          aria-hidden="true"
                          className="shrink-0 text-[#16933e]"
                        />
                      ) : (
                        <Plus
                          size={19}
                          aria-hidden="true"
                          className="shrink-0 text-[#16933e]"
                        />
                      )}
                    </button>
                  </h3>

                  <div
                    id={answerId}
                    aria-labelledby={questionId}
                    hidden={!isOpen}
                    className="px-5 pb-6"
                  >
                    <p className="text-xs leading-7 text-[#66766e]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </SlideUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="bg-[#f3f8f4] pb-12 md:pb-20">
      <div className={CONTAINER}>
        <div className="relative isolate overflow-hidden rounded-[27px] bg-gradient-to-br from-[#075535] to-[#073e2b] px-6 py-12 text-center text-white md:py-16">
          <div
            aria-hidden="true"
            className="absolute -right-48 -top-56 -z-10 h-[450px] w-[450px] rounded-full border-[65px] border-white/5"
          />

          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-semibold tracking-widest text-[#d6efdf]">
            YOUR NEXT STEP
          </span>

          <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.045em] md:text-[51px]">
            Your next invoice starts here.
          </h2>

          <p className="mx-auto mb-7 mt-5 max-w-[500px] text-sm leading-7 text-[#c9dfd0]">
            Create a professional invoice, share it through WhatsApp,
            and keep track of what’s paid.
          </p>

          <Link
            href="/sign-up"
            className={`${BUTTON} border-transparent bg-white text-[#064b32] hover:bg-[#eaf6ed]`}
          >
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FooterBranding() {
  const spotlightRef = useRef<SVGRadialGradientElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative mt-16 w-full overflow-hidden bg-[#063c29] md:mt-24"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          setHovered(true);
        }
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;

        const bounds = event.currentTarget.getBoundingClientRect();

        const x =
          ((event.clientX - bounds.left) / bounds.width) * 1000;

        const y =
          ((event.clientY - bounds.top) / bounds.height) * 230;

        spotlightRef.current?.setAttribute("cx", String(x));
        spotlightRef.current?.setAttribute("cy", String(y));
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <svg
        viewBox="0 0 1000 230"
        className="block h-auto w-full select-none"
        role="img"
        aria-label="InvoPing"
      >
        <defs>
          {/* Permanent subtle shading on the letters */}
          <linearGradient
            id="invoping-footer-base"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#0a4831"
            />
            <stop
              offset="100%"
              stopColor="#256348"
            />
          </linearGradient>

          {/* Circular light following the desktop pointer */}
          <radialGradient
            ref={spotlightRef}
            id="invoping-footer-spotlight"
            gradientUnits="userSpaceOnUse"
            cx="500"
            cy="115"
            r="170"
          >
            <stop
              offset="0%"
              stopColor="#9ce6b1"
              stopOpacity="0.65"
            />
            <stop
              offset="45%"
              stopColor="#70c58e"
              stopOpacity="0.25"
            />
            <stop
              offset="100%"
              stopColor="#70c58e"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>

        {/* Base lettering */}
        <text
          x="0"
          y="205"
          textLength="1000"
          lengthAdjust="spacingAndGlyphs"
          fill="url(#invoping-footer-base)"
          fontSize="240"
          fontWeight="900"
          fontFamily="inherit"
          letterSpacing="-12"
        >
          InvoPing
        </text>

        {/* Light is visible only within the lettering */}
        <text
          x="0"
          y="205"
          textLength="1000"
          lengthAdjust="spacingAndGlyphs"
          fill="url(#invoping-footer-spotlight)"
          fontSize="240"
          fontWeight="900"
          fontFamily="inherit"
          letterSpacing="-12"
          aria-hidden="true"
          className={`hidden transition-opacity duration-300 motion-reduce:transition-none md:block ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          InvoPing
        </text>
      </svg>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-[#063c29] pt-16 text-white">
      <div className={CONTAINER}>
        <div className="grid grid-cols-2 gap-9 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <PlatformLogo inverse />
            <p className="mt-5 max-w-[265px] text-xs leading-7 text-[#b3cdbd]">
              Professional invoices. Familiar conversations.
              A clearer view of payments.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 text-xs text-[#bad3c3]">
            <h3 className="mb-1 text-sm font-semibold text-white">Product</h3>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how-it-works" className="hover:text-white">How It Works</a>
            <a href="#who-its-for" className="hover:text-white">Who It’s For</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </div>

          <div className="flex flex-col items-start gap-4 text-xs text-[#bad3c3]">
            <h3 className="mb-1 text-sm font-semibold text-white">Your account</h3>
            <Link href="/sign-in" className="hover:text-white">Sign In</Link>
            <Link href="/sign-up" className="hover:text-white">Get Started Free</Link>
            <a href="#faq" className="hover:text-white">FAQs</a>
          </div>

          <div id="contact" className="col-span-2 flex flex-col items-start gap-4 md:col-span-1">
            <h3 className="mb-1 text-sm font-semibold">Contact &amp; legal</h3>
<a
  href="mailto:support@invo.net"
  className="text-xs text-[#bad3c3] transition-colors hover:text-white"
>
  support@invo.net
</a>
            <span className="text-[10px] text-[#a7c5b4]">
              Privacy Policy 
            </span>
            <span className="text-[10px] text-[#a7c5b4]">
              Terms of Service
            </span>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/15 pt-6 text-[9px] leading-6 text-[#91b29e] md:flex-row">
          <span>© {new Date().getFullYear()} InvoPing. All rights reserved.</span>
          <span>Built around the way you do business.</span>
                </div>
      </div>

      <FooterBranding />
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-white font-sans text-[#103f2f] antialiased [&_section[id]]:scroll-mt-28 [&_#contact]:scroll-mt-28">
      <a
        href="#main-content"
        className="sr-only fixed left-5 top-3 z-[100] rounded-lg bg-white px-5 py-3 text-[#064b32] focus:not-sr-only"
      >
        Skip to content
      </a>

      <Navigation />

      <main id="main-content">
        <HeroSection />
        <TrustStrip />
        <SolutionsSection />

        <Wave />
        <WorkflowSection />

        <Wave dark />
        <SpotlightSection />

        <Wave reverse />
        <AudienceSection />

        <PricingSection />

        {/* Authentic testimonials will be added when available. */}

        <Wave />
        <FaqSection />
        <ClosingSection />
      </main>

      <Footer />
    </div>
  );
}