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
  // Default to the first available database role if active_role metadata doesn't exist
  const activeRole = user.user_metadata?.active_role || availableRoles[0] || "MEMBER";

  // Fetch all users with their roles if active user is an ADMIN
  let allUsers: any[] = [];
  if (activeRole === "ADMIN") {
    allUsers = await prisma.user.findMany({
      include: {
        roles: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted text-sm mt-1">
              Selamat datang, {user.user_metadata?.full_name || user.email}
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Info & Role Switching */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="glass-card p-6">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Email</p>
            <p className="font-medium text-sm truncate">{user.email}</p>
          </div>
          
          <RoleSwitcher availableRoles={availableRoles} activeRole={activeRole} />

          <div className="glass-card p-6">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Status</p>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-success" />
              Aktif
            </span>
          </div>
        </div>

        {/* Warning if no roles found in the DB (trigger sync missing) */}
        {availableRoles.length === 0 && (
          <div className="glass-card p-6 mt-6 border-amber-500/20 bg-amber-500/5 animate-fade-in">
            <div className="flex gap-3">
              <span className="text-amber-500 text-lg">⚠️</span>
              <div>
                <h4 className="text-sm font-semibold text-amber-500">Peringatan: Sinkronisasi database belum aktif</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Akun Anda terdaftar di Supabase Auth, tetapi data Anda tidak tersinkronisasi ke tabel PostgreSQL publik. 
                  Pastikan Anda telah menjalankan <strong>SQL Trigger</strong> di Supabase SQL Editor Anda agar tabel <code>User</code> dan <code>UserRole</code> terisi otomatis saat registrasi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic content view depending on activeRole */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {activeRole === "ADMIN" ? (
            <AdminView initialUsers={allUsers} />
          ) : (
            <div className="glass-card p-10 text-center">
              <h2 className="text-xl font-bold mb-2">
                Tampilan khusus Role: <span className="text-accent">{activeRole}</span>
              </h2>
              <p className="text-muted text-sm mt-4">
                {activeRole === "TRAINER" && "💪 Panel Trainer: Lihat jadwal member, buat session notes, dan scan absensi member."}
                {activeRole === "MEMBER" && "📱 Panel Member: Generate QR code absensi, lihat sisa sesi, dan riwayat latihan."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
