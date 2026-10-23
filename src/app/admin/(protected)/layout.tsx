import { getAdminSession } from "@/lib/admin-auth/admin-auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      <AdminSidebar adminEmail={admin.email} adminRole={admin.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
