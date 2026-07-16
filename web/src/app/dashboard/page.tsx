import { prisma } from "@/lib/prisma";
import { requireAuth, getWibDayBounds, getWibMonthStart } from "@/lib/auth";
import { Role } from "@/generated/prisma";
import {
  Users,
  Dumbbell,
  QrCode,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Award,
  Activity,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";

export default async function DashboardPage() {
  const { user, activeRole, availableRoles } = await requireAuth();

  const greeting = getGreeting();
  const { startUtc: todayStart, endUtc: todayEnd } = getWibDayBounds();
  const startOfMonth = getWibMonthStart();

  // 1. ADMIN DATA FETCHING
  let totalUsers = 0;
  let totalTrainers = 0;
  let attendanceToday = 0;
  let sessionsThisMonth = 0;

  if (activeRole === Role.ADMIN) {
    const [usersCount, trainersCount, todayCount, monthCount] = await Promise.all([
      prisma.user.count(),
      prisma.userRole.count({ where: { role: Role.TRAINER } }),
      prisma.attendance.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.attendance.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
    ]);
    totalUsers = usersCount;
    totalTrainers = trainersCount;
    attendanceToday = todayCount;
    sessionsThisMonth = monthCount;
  }

  // 2. TRAINER DATA FETCHING
  let trainerTotalMembers = 0;
  let trainerTotalSessions = 0;
  let trainerSessionsThisMonth = 0;
  let trainerRecentClients: any[] = [];

  if (activeRole === Role.TRAINER) {
    let trainer = await prisma.trainer.findUnique({
      where: { userId: user.id },
    });
    if (!trainer) {
      trainer = await prisma.trainer.create({
        data: { userId: user.id },
      });
    }

    const [memberCount, totalCount, monthCount, recentLogs] = await Promise.all([
      prisma.member.count({
        where: { trainerId: trainer.id },
      }),
      prisma.attendance.count({
        where: { trainerId: trainer.id },
      }),
      prisma.attendance.count({
        where: {
          trainerId: trainer.id,
          date: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.attendance.findMany({
        where: { trainerId: trainer.id },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    trainerTotalMembers = memberCount;
    trainerTotalSessions = totalCount;
    trainerSessionsThisMonth = monthCount;
    trainerRecentClients = recentLogs;
  }

  // 3. MEMBER DATA FETCHING
  let memberRemainingSessions = 0;
  let memberTotalPackageSessions = 0;
  let memberSessionsThisMonth = 0;
  let memberTotalSessions = 0;
  let memberActivePackageName = "Tidak ada paket aktif";
  let memberExpiryDate: Date | null = null;
  let memberRecentAttendances: any[] = [];

  if (activeRole === Role.MEMBER) {
    let member = await prisma.member.findUnique({
      where: { userId: user.id },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { package: true },
        },
        memberships: {
          where: { status: "ACTIVE" },
          include: { package: true },
        },
      },
    });

    if (!member) {
      member = await prisma.member.create({
        data: { userId: user.id },
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { package: true },
          },
          memberships: {
            where: { status: "ACTIVE" },
            include: { package: true },
          },
        },
      });
    }

    const activeSub = member.subscriptions[0];
    const activeMembership = member.memberships[0];

    memberRemainingSessions =
      (activeSub?.remainingSessions || 0) + (activeMembership?.remainingSessions || 0);
    memberTotalPackageSessions =
      activeSub?.package.sessions || activeMembership?.package.sessions || 0;
    memberActivePackageName =
      activeSub?.package.name || activeMembership?.package.name || "Tidak ada paket aktif";
    memberExpiryDate = activeSub?.endDate || activeMembership?.endDate || null;

    const [monthCount, totalCount, recentLogs] = await Promise.all([
      prisma.attendance.count({
        where: {
          memberId: member.id,
          date: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.attendance.count({
        where: { memberId: member.id },
      }),
      prisma.attendance.findMany({
        where: { memberId: member.id },
        include: {
          trainer: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    memberSessionsThisMonth = monthCount;
    memberTotalSessions = totalCount;
    memberRecentAttendances = recentLogs;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <p className="text-muted text-sm font-medium">{greeting}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          {user.fullName || "Dashboard"}
        </h1>
      </div>

      {/* Sync Warning */}
      {availableRoles.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5">
          <div className="flex gap-4">
            <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-700">
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

      {/* ── ADMIN OVERVIEW ── */}
      {activeRole === Role.ADMIN && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon={<Users size={18} />}
              label="Total Pengguna"
              value={totalUsers}
              accent="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              icon={<Dumbbell size={18} />}
              label="Trainer Aktif"
              value={totalTrainers}
              accent="text-violet-600"
              bg="bg-violet-50"
            />
            <StatCard
              icon={<QrCode size={18} />}
              label="Absensi Hari Ini"
              value={attendanceToday}
              accent="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Sesi Bulan Ini"
              value={sessionsThisMonth}
              accent="text-amber-600"
              bg="bg-amber-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="text-sm font-semibold mb-4">Panduan Administrator</h3>
              <div className="space-y-4 text-xs text-muted leading-relaxed">
                <p>
                  Sebagai Administrator, Anda memiliki akses penuh untuk mengatur otorisasi pengguna. Buka tab <b>Manajemen User</b> di menu samping untuk mengaktifkan akses Trainer atau Admin kepada pengguna lain.
                </p>
                <p>
                  Semua aktivitas perubahan wewenang pengguna dan pencatatan absensi yang dilakukan oleh Trainer akan secara otomatis terekam di tab <b>Audit Log</b> demi menjaga integritas data latihan.
                </p>
              </div>
            </div>
            <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
              <Award className="text-accent mb-3" size={32} />
              <h4 className="text-xs font-semibold">SaaS-Grade PTMS Dev</h4>
              <p className="text-[10px] text-muted mt-2 max-w-[200px]">
                Sistem absensi berbasis QR Code terenkripsi instan 30 detik untuk keandalan pencatatan kehadiran traineer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TRAINER OVERVIEW ── */}
      {activeRole === Role.TRAINER && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<Users size={18} />}
              label="Member Dibimbing"
              value={trainerTotalMembers}
              accent="text-violet-600"
              bg="bg-violet-50"
            />
            <StatCard
              icon={<Activity size={18} />}
              label="Sesi Scan Bulan Ini"
              value={trainerSessionsThisMonth}
              accent="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Total Sesi Sukses"
              value={trainerTotalSessions}
              accent="text-emerald-600"
              bg="bg-emerald-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Aktivitas Check-in Terbaru</h3>
                <span className="text-[10px] text-accent font-medium">Real-time</span>
              </div>

              {trainerRecentClients.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs">
                  Belum ada riwayat check-in member yang Anda proses.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {trainerRecentClients.map((att) => (
                    <div key={att.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card border border-card-border flex items-center justify-center text-xs font-semibold">
                          {(att.member.user.fullName?.[0] || "M").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{att.member.user.fullName}</p>
                          <p className="text-[10px] text-muted">{att.member.user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <CheckCircle2 size={10} /> Sukses
                        </span>
                        <p className="text-[9px] text-muted mt-0.5">
                          {format(new Date(att.createdAt), "dd MMM, HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                <h4 className="text-xs font-semibold">Pemberitahuan Trainer</h4>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Gunakan menu <b>QR Absensi</b> untuk memverifikasi QR Code latihan milik member. Setiap scan yang sukses akan memotong sisa sesi member dan tercatat di riwayat kehadiran secara instan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBER OVERVIEW ── */}
      {activeRole === Role.MEMBER && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<Award size={18} />}
              label="Sisa Kuota Sesi"
              value={memberRemainingSessions}
              accent="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              icon={<Activity size={18} />}
              label="Latihan Bulan Ini"
              value={memberSessionsThisMonth}
              accent="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Total Kehadiran"
              value={memberTotalSessions}
              accent="text-violet-600"
              bg="bg-violet-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Subscription details */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-accent" />
                <h4 className="text-xs font-semibold">Paket Aktif Anda</h4>
              </div>
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-[10px] text-muted uppercase">Nama Paket</p>
                  <p className="text-xs font-semibold mt-0.5">{memberActivePackageName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase">Tanggal Kadaluarsa</p>
                  <p className="text-xs font-semibold mt-0.5">
                    {memberExpiryDate ? format(new Date(memberExpiryDate), "dd MMMM yyyy") : "-"}
                  </p>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${
                        memberTotalPackageSessions > 0
                          ? Math.min(
                              100,
                              (memberRemainingSessions / memberTotalPackageSessions) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Attendance Logs */}
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Riwayat Kehadiran Anda</h3>

              {memberRecentAttendances.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs">
                  Belum ada riwayat kehadiran latihan yang tercatat.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {memberRecentAttendances.map((att) => (
                    <div key={att.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                          <Calendar size={13} className="text-muted" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">
                            {format(new Date(att.date), "EEEE, dd MMMM yyyy")}
                          </p>
                          <p className="text-[10px] text-muted">
                            Trainer: {att.trainer?.user.fullName || "Staf PTMS"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Hadir
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
