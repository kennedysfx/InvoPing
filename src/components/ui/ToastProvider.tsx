"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#0f172a",
          color: "#f8fafc",
          border: "1px solid #334155",
        },
      }}
    />
  );
}
