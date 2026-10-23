import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvoPing — Create invoices. Send on WhatsApp. Get paid.",
  description: "The simplest invoicing and payment-tracking SaaS for freelancers, contractors, agencies, and small businesses that use WhatsApp.",
  keywords: ["invoicing", "whatsapp invoices", "freelancer billing", "payment tracking", "invoice PDF"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <body className={`${inter.className} h-full antialiased text-slate-100 bg-slate-950`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
