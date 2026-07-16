import { requireAuth } from "@/lib/auth";
import { Role } from "@/generated/prisma";
import { MemberQr } from "./member-qr";
import { TrainerScanner } from "./trainer-scanner";
import { QrCode, ShieldAlert } from "lucide-react";

export default async function AttendancePage() {
  const { activeRole } = await requireAuth();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
          <QrCode size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QR Absensi</h1>
          <p className="text-muted text-sm mt-0.5">
            {activeRole === Role.MEMBER
              ? "Tunjukkan QR Code ini ke Trainer untuk verifikasi latihan"
              : activeRole === Role.TRAINER
              ? "Scan QR Code member untuk mencatat kehadiran"
              : "Menu absensi bagi Member dan Trainer"}
          </p>
        </div>
      </div>

      {activeRole === Role.MEMBER && (
        <div className="py-4">
          <MemberQr />
        </div>
      )}

      {activeRole === Role.TRAINER && (
        <div className="py-4">
          <TrainerScanner />
        </div>
      )}

      {activeRole === Role.ADMIN && (
        <div className="glass-card px-8 py-12 text-center max-w-md mx-auto">
          <ShieldAlert size={32} className="text-accent mx-auto mb-4 opacity-60" />
          <h2 className="text-lg font-semibold mb-2">Akses Terbatas</h2>
          <p className="text-muted text-sm leading-relaxed">
            Halaman QR Absensi ini dikhususkan bagi pengguna dengan role Member (untuk generate QR) dan Trainer (untuk memverifikasi QR).
          </p>
        </div>
      )}
    </div>
  );
}
