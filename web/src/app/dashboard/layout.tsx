import { requireAuth } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { RoleSwitcher } from "./role-switcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, availableRoles, activeRole } = await requireAuth();
  const userName = user.fullName;
  const userEmail = user.email;

  return (
    /* No orb divs — floating-orb anti-pattern removed */
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar
        activeRole={activeRole}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main content — offset by sidebar on desktop */}
      <main
        className="lg:ml-[260px] min-h-screen"
        style={{
          /* gate 10: specify property, never transition-all */
          transition: "margin-left var(--dur-medium) var(--ease-out)",
        }}
      >
        {/* Top Bar — glass-tinted paper, border via token */}
        <header
          className="sticky top-0"
          style={{
            zIndex: 300,
            background: "oklch(99% 0.004 264 / 0.88)",
            borderBottom: "1px solid var(--card-border)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center justify-between px-6 lg:px-8 h-16">
            {/* Mobile: spacer so content doesn't overlap the fixed hamburger button */}
            <div className="w-12 lg:hidden" />
            <div className="hidden lg:block" />

            <div className="flex items-center gap-4">
              {availableRoles.length > 1 && (
                <RoleSwitcher
                  availableRoles={availableRoles}
                  activeRole={activeRole}
                />
              )}
              {/* Avatar — uses token colors, not hardcoded */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                }}
              >
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
