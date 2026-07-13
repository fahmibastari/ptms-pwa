import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Dumbbell, Calendar, User, Clock, CheckCircle, ShieldAlert } from "lucide-react";

export const revalidate = 0; // live reload data

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch roles
  const dbRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    select: { role: true },
  });

  const availableRoles = dbRoles.map((r) => r.role);
  const activeRole = user.user_metadata?.active_role || availableRoles[0] || "MEMBER";

  let sessions: any[] = [];

  if (activeRole === "ADMIN") {
    sessions = await prisma.attendance.findMany({
      include: {
        member: {
          include: {
            user: true,
          },
        },
        trainer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else if (activeRole === "TRAINER") {
    const trainer = await prisma.trainer.findUnique({
      where: { userId: user.id },
    });
    if (trainer) {
      sessions = await prisma.attendance.findMany({
        where: { trainerId: trainer.id },
        include: {
          member: {
            include: {
              user: true,
            },
          },
          trainer: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
  } else if (activeRole === "MEMBER") {
    const member = await prisma.member.findUnique({
      where: { userId: user.id },
    });
    if (member) {
      sessions = await prisma.attendance.findMany({
        where: { memberId: member.id },
        include: {
          member: {
            include: {
              user: true,
            },
          },
          trainer: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
          <Dumbbell size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sesi Latihan</h1>
          <p className="text-muted text-sm mt-0.5">
            {activeRole === "ADMIN"
              ? "Semua data kehadiran dan sesi latihan di sistem"
              : activeRole === "TRAINER"
              ? "Daftar sesi bimbingan latihan yang Anda verifikasi"
              : "Riwayat kehadiran sesi latihan Anda"}
          </p>
        </div>
      </div>

      {/* Session Table/Card */}
      {sessions.length === 0 ? (
        <div className="glass-card px-8 py-14 text-center">
          <Dumbbell size={32} className="text-muted/40 mx-auto mb-4" />
          <h2 className="text-sm font-semibold mb-2 text-white">Belum Ada Sesi Latihan</h2>
          <p className="text-muted text-xs max-w-md mx-auto leading-relaxed">
            {activeRole === "MEMBER"
              ? "Generate QR Code absensi Anda pada menu QR Absensi dan tunjukkan ke Trainer untuk mencatat sesi latihan pertama Anda."
              : activeRole === "TRAINER"
              ? "Lakukan pemindaian QR Code member untuk melakukan verifikasi latihan pertama mereka."
              : "Belum ada sesi latihan atau riwayat absensi yang terdaftar di dalam sistem."}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Tanggal & Waktu</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Trainer</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Metode</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Date Time */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-white">
                        <Calendar size={13} className="text-muted" />
                        <span>{format(new Date(session.date), "dd MMM yyyy")}</span>
                        <span className="text-muted">•</span>
                        <Clock size={13} className="text-muted" />
                        <span>{format(new Date(session.createdAt), "HH:mm")}</span>
                      </div>
                    </td>

                    {/* Member Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] text-muted font-bold">
                          {(session.member.user.fullName?.[0] || "M").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{session.member.user.fullName}</p>
                          <p className="text-[10px] text-muted">{session.member.user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Trainer Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-muted" />
                        <span className="text-xs text-white">
                          {session.trainer?.user.fullName || "Staf PTMS"}
                        </span>
                      </div>
                    </td>

                    {/* Check In Type */}
                    <td className="px-6 py-4">
                      <span className="text-[10px] text-muted bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded font-mono">
                        {session.checkInType || "MANUAL"}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                        <CheckCircle size={10} /> {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
