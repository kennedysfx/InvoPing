
"use client";

import { useEffect, useState, type FormEvent } from "react";

interface EarlyAccessModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export default function EarlyAccessModal({
  open,
  onClose,
  onSubmit,
}: EarlyAccessModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, loading, onClose]);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setError("");
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setError("Please enter your name and email address.");
      return;
    }

    setLoading(true);

    try {
      const result = await onSubmit({
        name: cleanName,
        email: cleanEmail,
      });

      if (!result.success) {
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to complete your registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="early-access-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl sm:p-9"
      >
        {!submitted ? (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
            >
              &times;
            </button>

            <div className="mb-6">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                ✨
              </div>

              <h2
                id="early-access-title"
                className="text-2xl font-bold tracking-tight text-gray-900"
              >
                We&apos;re Getting Ready for You!
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                We&apos;re putting the finishing touches on InvoPing to make
                invoicing, WhatsApp sharing and payment tracking simpler
                for your business.
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Join our waitlist and get a free 30-day PRO account when we launch.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="early-access-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  id="early-access-name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="early-access-email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  id="early-access-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-green-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Notify Me When You Launch"}
              </button>

              <p className="text-center text-xs leading-5 text-gray-500">
                By joining, you agree to receive InvoPing launch updates.
                You can unsubscribe at any time.
              </p>
            </form>
          </>
        ) : (
          <div className="py-5 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">
              ✓
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              You&apos;re on the list!
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Thank you for your interest in InvoPing. We&apos;re excited to
              have you join us. We&apos;ll send you an email as soon as
              InvoPing is officially ready. We look forward to welcoming you!
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-7 w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Got It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
