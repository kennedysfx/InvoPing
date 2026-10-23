
"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type AuthCloseButtonProps = {
  homeOnly?: boolean;
};

export function AuthCloseButton({
  homeOnly = false,
}: AuthCloseButtonProps) {
  const router = useRouter();

  function handleClose() {
    if (homeOnly) {
      // Restore homepage position if the user came from there.
      const savedPosition = sessionStorage.getItem(
        "invoping_home_scroll"
      );

      if (savedPosition !== null) {
        sessionStorage.setItem(
          "invoping_restore_home_scroll",
          savedPosition
        );
        sessionStorage.removeItem("invoping_home_scroll");
      }

      router.replace("/");
      return;
    }

    // Preserve existing Admin Sign In behaviour.
    try {
      const referrer = document.referrer;

      if (referrer) {
        const previousUrl = new URL(referrer);

        if (
          previousUrl.origin === window.location.origin &&
          previousUrl.pathname !== window.location.pathname
        ) {
          router.back();
          return;
        }
      }
    } catch {
      // Use homepage fallback.
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      aria-label={
        homeOnly
          ? "Close and return to homepage"
          : "Close and return to previous page"
      }
      title="Close"
      className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10
        flex h-10 w-10 items-center justify-center
        rounded-full border border-slate-700
        bg-slate-900 text-slate-400
        hover:bg-slate-800 hover:text-white
        transition-colors"
    >
      <X className="w-5 h-5" />
    </button>
  );
}
