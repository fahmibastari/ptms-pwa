import { prisma } from "@/lib/prisma";
import { requireAuth, hasAdminRole } from "@/lib/auth";
import { Role } from "@/generated/prisma";
import { Dumbbell } from "lucide-react";
import { SessionsList } from "./sessions-list";

export const revalidate = 0;

const sessionInclude = {
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
  sessionNote: true,
} as const;

type SessionWithNote = Awaited<
  ReturnType<
    typeof prisma.attendance.findMany<{ include: typeof sessionInclude }>
  >
>[number];

export default async function SessionsPage() {
  const ctx = await requireAuth();
  const { activeRole } = ctx;
  const isAdmin = await hasAdminRole(ctx.user.id);
  const canEditNotes = activeRole === Role.TRAINER;

  let sessions: SessionWithNote[] = [];

  if (isAdmin && activeRole === Role.ADMIN) {
    sessions = await prisma.attendance.findMany({
      include: sessionInclude,
      orderBy: { createdAt: "desc" },
    });
  } else if (activeRole === Role.TRAINER) {
    const trainer = await prisma.trainer.findUnique({
      where: { userId: ctx.user.id },
    });
    if (trainer) {
      sessions = await prisma.attendance.findMany({
        where: { trainerId: trainer.id },
        include: sessionInclude,
        orderBy: { createdAt: "desc" },
      });
    }
  } else if (activeRole === Role.MEMBER) {
    const member = await prisma.member.findUnique({
      where: { userId: ctx.user.id },
    });
    if (member) {
      sessions = await prisma.attendance.findMany({
        where: { memberId: member.id },
        include: sessionInclude,
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
          <Dumbbell size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sesi Latihan</h1>
          <p className="text-muted text-sm mt-0.5">
            {activeRole === Role.ADMIN
              ? "Semua data kehadiran dan sesi latihan di sistem"
              : activeRole === Role.TRAINER
              ? "Daftar sesi bimbingan latihan yang Anda verifikasi"
              : "Riwayat kehadiran sesi latihan Anda"}
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="glass-card px-8 py-14 text-center">
          <Dumbbell size={32} className="text-muted/40 mx-auto mb-4" />
          <h2 className="text-sm font-semibold mb-2 text-white">Belum Ada Sesi Latihan</h2>
          <p className="text-muted text-xs max-w-md mx-auto leading-relaxed">
            {activeRole === Role.MEMBER
              ? "Generate QR Code absensi Anda pada menu QR Absensi dan tunjukkan ke Trainer untuk mencatat sesi latihan pertama Anda."
              : activeRole === Role.TRAINER
              ? "Lakukan pemindaian QR Code member untuk melakukan verifikasi latihan pertama mereka."
              : "Belum ada sesi latihan atau riwayat absensi yang terdaftar di dalam sistem."}
          </p>
        </div>
      ) : (
        <SessionsList
          sessions={sessions}
          canEditNotes={canEditNotes}
        />
      )}
    </div>
  );
}
