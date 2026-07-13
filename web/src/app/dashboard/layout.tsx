import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "./sidebar";
import { RoleSwitcher } from "./role-switcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    select: { role: true },
  });

  const availableRoles = dbRoles.map((r) => r.role);
  const activeRole =
    user.user_metadata?.active_role || availableRoles[0] || "MEMBER";
  const userName = user.user_metadata?.full_name || "User";
  const userEmail = user.email || "";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <Sidebar
        activeRole={activeRole}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content — offset by sidebar width on desktop */}
      <main className="relative z-10 lg:ml-[260px] min-h-screen transition-all duration-300">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0a0a0f]/70 border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-6 lg:px-8 h-16">
            {/* Spacer for mobile hamburger */}
            <div className="w-10 lg:hidden" />
            <div className="hidden lg:block" />

            <div className="flex items-center gap-4">
              {availableRoles.length > 1 && (
                <RoleSwitcher
                  availableRoles={availableRoles}
                  activeRole={activeRole}
                />
              )}
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent font-bold text-xs">
                {userName[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-6 lg:px-8 py-8 w-full max-w-6xl overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
