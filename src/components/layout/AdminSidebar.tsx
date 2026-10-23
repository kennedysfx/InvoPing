
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  CreditCard,
  Activity,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { adminLogoutAction } from "@/actions/admin";

const adminNavItems = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Businesses", href: "/admin/businesses", icon: Building2 },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Activity Logs", href: "/admin/activity", icon: Activity },
];

export function AdminSidebar({
  adminEmail,
  adminRole,
}: {
  adminEmail?: string;
  adminRole?: string;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const navigation = (
    <>
      <div>
<div className="flex h-20 items-center border-b border-slate-800 bg-rose-950/20 px-4 pr-12">
  <div>
    <div onClick={() => setIsOpen(false)}>
      <BrandLogo href="/admin/dashboard" variant="dark" />
    </div>

    <div className="mt-1 flex items-center gap-2 pl-[46px]">
      <span className="rounded border border-rose-800 bg-rose-950 px-1.5 py-0.5 text-[9px] font-semibold text-rose-400">
        ADMIN
      </span>

      <span className="text-[9px] text-slate-400">
        Platform Management
      </span>
    </div>
  </div>
</div>

        <nav className="p-3 space-y-1" aria-label="Admin navigation">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-rose-600/20 text-rose-400 font-semibold border border-rose-800/40"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                )}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5",
                    isActive ? "text-rose-400" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {adminEmail || "Admin"}
            </p>
            <p className="text-[10px] text-rose-400 font-mono">
              {adminRole || "SUPER_ADMIN"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => adminLogoutAction()}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800"
            title="Sign Out Admin"
            aria-label="Sign out admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile and tablet header */}
      <header className="md:hidden h-16 shrink-0 flex items-center justify-between px-4 bg-slate-950 border-b border-slate-800">
<div className="flex items-center gap-2">
  <BrandLogo href="/admin/dashboard" variant="dark" />

  <span className="rounded border border-rose-800 bg-rose-950 px-1.5 py-0.5 text-[9px] font-semibold text-rose-400">
    ADMIN
  </span>
</div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-slate-200 hover:bg-slate-800"
          aria-label="Open admin menu"
          aria-expanded={isOpen}
          aria-controls="admin-mobile-menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800 text-slate-200 flex-col justify-between shrink-0 min-h-screen">
        {navigation}
      </aside>

      {/* Mobile navigation drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsOpen(false)}
            aria-label="Close admin menu"
          />

          <aside
            id="admin-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 text-slate-200 flex flex-col justify-between shadow-2xl"
          >
            {navigation}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close admin menu"
            >
              <X className="w-5 h-5" />
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
