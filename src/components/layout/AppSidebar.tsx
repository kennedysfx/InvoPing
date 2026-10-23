"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BellRing,
  BarChart3,
  Settings,
  PlusCircle,
} from "lucide-react";
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

export function AppSidebar({ planName, usageText }: { planName?: string; usageText?: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col justify-between hidden md:flex shrink-0 min-h-screen">
      <div>
{/* Dashboard logo */}
<div className="flex h-16 items-center border-b border-slate-800 px-6">
  <div>
    <BrandLogo href="/dashboard" variant="dark" />

    <span className="mt-1 block pl-[46px] text-[10px] font-medium uppercase tracking-wide text-slate-400">
      WhatsApp Invoicing
    </span>
  </div>
</div>

        {/* Quick Action Button */}
        <div className="p-4">
          <Link
            href="/invoices/new"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-600/15 text-emerald-400 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-emerald-400" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Plan Usage Card */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-300">{planName || "Free Plan"}</span>
            <Link href="/settings" className="text-[11px] text-emerald-400 hover:underline">
              Upgrade
            </Link>
          </div>
          <p className="text-xs text-slate-400">{usageText || "Manage your usage & billing"}</p>
        </div>
      </div>
    </aside>
  );
}
