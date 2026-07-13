import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminView } from "./admin-view";
import {
  Users,
  Dumbbell,
  QrCode,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
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

  // Fetch stats for admin overview
  let totalUsers = 0;
  let totalTrainers = 0;
  let allUsers: any[] = [];

  if (activeRole === "ADMIN") {
    [totalUsers, totalTrainers, allUsers] = await Promise.all([
      prisma.user.count(),
      prisma.userRole.count({ where: { role: "TRAINER" } }),
      prisma.user.findMany({
        include: { roles: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
  }

  const greeting = getGreeting();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Page Header ── */}
      <div>
        <p className="text-muted text-sm">{greeting}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          {user.user_metadata?.full_name || "Dashboard"}
        </h1>
      </div>

      {/* ── Sync Warning ── */}
      {availableRoles.length === 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-6 py-5">
          <div className="flex gap-4">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-400">
                Sinkronisasi database belum aktif
              </h4>
              <p className="text-xs text-muted mt-1.5 leading-relaxed max-w-xl">
                Akun Anda terdaftar di Supabase Auth, tetapi belum
                tersinkronisasi ke tabel PostgreSQL. Jalankan SQL Trigger di
                Supabase SQL Editor agar tabel User dan UserRole terisi otomatis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin View ── */}
      {activeRole === "ADMIN" && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon={<Users size={18} />}
              label="Total Pengguna"
              value={totalUsers}
              accent="text-blue-400"
              bg="bg-blue-500/10"
            />
            <StatCard
              icon={<Dumbbell size={18} />}
              label="Trainer Aktif"
              value={totalTrainers}
              accent="text-violet-400"
              bg="bg-violet-500/10"
            />
            <StatCard
              icon={<QrCode size={18} />}
              label="Absensi Hari Ini"
              value={0}
              accent="text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Sesi Bulan Ini"
              value={0}
              accent="text-amber-400"
              bg="bg-amber-500/10"
            />
          </div>

          {/* User Management */}
          <AdminView initialUsers={allUsers} />
        </>
      )}

      {/* ── Trainer View ── */}
      {activeRole === "TRAINER" && (
        <div className="glass-card px-8 py-12 text-center">
          <Dumbbell size={32} className="text-accent mx-auto mb-4 opacity-60" />
          <h2 className="text-lg font-semibold mb-2">Panel Trainer</h2>
          <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
            Lihat jadwal member, buat session notes, dan scan absensi member.
            Fitur ini sedang dalam pengembangan.
          </p>
        </div>
      )}

      {/* ── Member View ── */}
      {activeRole === "MEMBER" && (
        <div className="glass-card px-8 py-12 text-center">
          <QrCode size={32} className="text-accent mx-auto mb-4 opacity-60" />
          <h2 className="text-lg font-semibold mb-2">Panel Member</h2>
          <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
            Generate QR code absensi, lihat sisa sesi, dan riwayat latihan Anda.
            Fitur ini sedang dalam pengembangan.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  bg: string;
}) {
  return (
    <div className="glass-card px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <span className={`p-2 rounded-lg ${bg}`}>
          <span className={accent}>{icon}</span>
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-muted text-xs mt-1">{label}</p>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 17) return "Selamat Siang";
  return "Selamat Malam";
}
