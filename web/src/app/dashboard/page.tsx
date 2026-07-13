import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";
import { RoleSwitcher } from "./role-switcher";
import { AdminView } from "./admin-view";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch roles from the PostgreSQL database
  const dbRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    select: { role: true },
  });

  const availableRoles = dbRoles.map((r) => r.role);
  const activeRole = user.user_metadata?.active_role || availableRoles[0] || "MEMBER";

  // Fetch all users with their roles if active user is an ADMIN
  let allUsers: any[] = [];
  if (activeRole === "ADMIN") {
    allUsers = await prisma.user.findMany({
      include: { roles: true },
      orderBy: { createdAt: "desc" },
    });
  }

  const greeting = getGreeting();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-10 sm:py-16">
        
        {/* ── Top Bar ── */}
        <header className="flex items-start sm:items-center justify-between gap-4 mb-14 animate-fade-in">
          <div>
            <p className="text-muted text-sm">{greeting}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              {user.user_metadata?.full_name || user.email}
            </h1>
          </div>
          <LogoutButton />
        </header>

        {/* ── Stat Cards ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14 animate-fade-in" style={{ animationDelay: "0.08s" }}>
          <div className="glass-card px-7 py-6">
            <p className="text-muted text-[11px] uppercase tracking-widest font-medium mb-2">Email</p>
            <p className="font-medium text-sm truncate">{user.email}</p>
          </div>

          <RoleSwitcher availableRoles={availableRoles} activeRole={activeRole} />

          <div className="glass-card px-7 py-6">
            <p className="text-muted text-[11px] uppercase tracking-widest font-medium mb-2">Status</p>
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              Aktif
            </span>
          </div>
        </section>

        {/* ── Sync Warning ── */}
        {availableRoles.length === 0 && (
          <section className="mb-14 animate-fade-in">
            <div className="glass-card px-7 py-6 border-amber-500/20 bg-amber-500/5">
              <div className="flex gap-4">
                <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
                <div>
                  <h4 className="text-sm font-semibold text-amber-400">Sinkronisasi database belum aktif</h4>
                  <p className="text-xs text-muted mt-2 leading-relaxed max-w-xl">
                    Akun Anda terdaftar di Supabase Auth, tetapi belum tersinkronisasi ke tabel PostgreSQL.
                    Jalankan <strong className="text-amber-300">SQL Trigger</strong> di Supabase SQL Editor agar tabel <code className="text-amber-300">User</code> dan <code className="text-amber-300">UserRole</code> terisi otomatis saat registrasi.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Main Content ── */}
        <section className="animate-fade-in" style={{ animationDelay: "0.16s" }}>
          {activeRole === "ADMIN" ? (
            <AdminView initialUsers={allUsers} />
          ) : (
            <div className="glass-card px-10 py-14 text-center">
              <h2 className="text-xl font-bold mb-3">
                Panel <span className="text-accent">{activeRole}</span>
              </h2>
              <p className="text-muted text-sm leading-relaxed max-w-md mx-auto">
                {activeRole === "TRAINER" && "💪 Lihat jadwal member, buat session notes, dan scan absensi member."}
                {activeRole === "MEMBER" && "📱 Generate QR code absensi, lihat sisa sesi, dan riwayat latihan Anda."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi 👋";
  if (hour < 17) return "Selamat Siang 👋";
  return "Selamat Malam 👋";
}
