import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClipboardList, AlertCircle, User, Shield, Key, Check } from "lucide-react";
import { format } from "date-fns";

export const revalidate = 0; // Disable caching to see live logs

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  ADD_ROLE: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: <Shield size={11} />,
  },
  REMOVE_ROLE: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    icon: <Shield size={11} />,
  },
  VERIFY_QR: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/20",
    icon: <Key size={11} />,
  },
};

export default async function LogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify Role
  const dbRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    select: { role: true },
  });

  const availableRoles = dbRoles.map((r) => r.role);
  const activeRole = user.user_metadata?.active_role || availableRoles[0] || "MEMBER";

  if (activeRole !== "ADMIN") {
    return (
      <div className="glass-card px-8 py-12 text-center animate-fade-in">
        <AlertCircle size={32} className="text-error mx-auto mb-4 opacity-75" />
        <h2 className="text-lg font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Hanya pengguna dengan wewenang ADMIN yang diperbolehkan untuk melihat log audit sistem.
        </p>
      </div>
    );
  }

  // Fetch audit logs order by newest first
  const logs = await prisma.auditLog.findMany({
    include: {
      actor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Limit to last 100 entries
  });

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
          <ClipboardList size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted text-sm mt-0.5">Riwayat aktivitas administratif dan verifikasi sistem</p>
        </div>
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="glass-card px-8 py-14 text-center">
          <ClipboardList size={32} className="text-muted/40 mx-auto mb-4" />
          <p className="text-muted text-sm">Belum ada aktivitas yang tercatat di sistem.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Waktu</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Pelaku (Actor)</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Aktivitas</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Detail metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log) => {
                  const style = ACTION_STYLES[log.action] || {
                    bg: "bg-white/[0.03]",
                    text: "text-muted",
                    border: "border-white/[0.06]",
                    icon: <ClipboardList size={11} />,
                  };

                  const formattedDate = format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss");
                  const metadata = log.metadata ? JSON.stringify(log.metadata) : "-";

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-muted whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Actor */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] text-muted font-bold">
                            {(log.actor.fullName?.[0] || "A").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {log.actor.fullName}
                            </p>
                            <p className="text-[10px] text-muted truncate">{log.actor.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Action style badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                        >
                          {style.icon}
                          {log.action}
                        </span>
                      </td>

                      {/* Metadata detail parsing */}
                      <td className="px-6 py-4 text-xs text-muted max-w-xs truncate">
                        {log.action === "VERIFY_QR" && typeof log.metadata === "object" && log.metadata !== null ? (
                          <span>
                            Absensi Member: <b>{(log.metadata as any).memberName}</b> (Sisa sesi:{" "}
                            <b>{(log.metadata as any).remainingSessions}</b>)
                          </span>
                        ) : log.action === "ADD_ROLE" || log.action === "REMOVE_ROLE" ? (
                          <span>
                            Role <b>{(log.metadata as any)?.role}</b> {(log.metadata as any)?.action === "ADD" ? "diberikan" : "dicabut"}
                          </span>
                        ) : (
                          metadata
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
