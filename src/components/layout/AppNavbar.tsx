
"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { usePathname } from "next/navigation";
import { logoutCustomerAction } from "@/actions/auth";
import {
  LogOut,
  Building,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  BellRing,
  BarChart3,
  Settings,
  PlusCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { clsx } from "clsx";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Reminders", href: "/reminders", icon: BellRing },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppNavbar({
  userEmail,
  businessName,
  currency,
}: {
  userEmail?: string;
  businessName?: string;
  currency?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="h-16 shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between text-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            aria-controls="user-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </button>

<div className="md:hidden">
  <BrandLogo href="/dashboard" variant="dark" />
</div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            <Building className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-200">
              {businessName || "My Business"}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              {currency || "USD"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="hidden md:inline-block font-medium">
              {userEmail}
            </span>
          </div>

          <button
            type="button"
            onClick={() => logoutCustomerAction()}
            className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />

          <aside
            id="user-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="User navigation"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col shadow-2xl"
          >
            <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-slate-800">
<div onClick={() => setMobileOpen(false)}>
  <BrandLogo href="/dashboard" variant="dark" />
</div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <Link
                  href="/invoices/new"
                  onClick={() => setMobileOpen(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Invoice
                </Link>
              </div>

              <nav
                className="px-3 space-y-1"
                aria-label="User navigation links"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-emerald-600/15 text-emerald-400 font-semibold"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                      )}
                    >
                      <Icon
                        className={clsx(
                          "w-5 h-5",
                          isActive
                            ? "text-emerald-400"
                            : "text-slate-400"
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="shrink-0 p-4 border-t border-slate-800">
              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
                <p className="text-xs font-semibold text-slate-300">
                  Account Settings
                </p>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Manage plan and billing
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
