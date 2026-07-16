import { prisma } from "@/lib/prisma";
import { requireAuth, hasAdminRole } from "@/lib/auth";
import { ClipboardList, AlertCircle, User, Shield, Key } from "lucide-react";
import { format } from "date-fns";

export const revalidate = 0;

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  ADD_ROLE: {
    bg: "bg-success-surface", text: "text-success-ink", border: "border-success-border",
    icon: <Shield size={11} />,
  },
  REMOVE_ROLE: {
    bg: "bg-error-surface", text: "text-error-ink", border: "border-error-border",
    icon: <Shield size={11} />,
  },
  SWITCH_ROLE: {
    bg: "bg-info-surface", text: "text-info-ink", border: "border-info-border",
    icon: <Shield size={11} />,
  },
  ASSIGN_TRAINER: {
    bg: "bg-warning-surface", text: "text-warning-ink", border: "border-warning-border",
    icon: <Shield size={11} />,
  },
  UNASSIGN_TRAINER: {
    bg: "bg-warning-surface", text: "text-warning-ink", border: "border-warning-border",
    icon: <Shield size={11} />,
  },
  CREATE_PACKAGE: {
    bg: "bg-accent-muted", text: "text-accent", border: "border-accent/20",
    icon: <Key size={11} />,
  },
  UPDATE_PACKAGE: {
    bg: "bg-info-surface", text: "text-info-ink", border: "border-info-border",
    icon: <Key size={11} />,
  },
  DELETE_PACKAGE: {
    bg: "bg-error-surface", text: "text-error-ink", border: "border-error-border",
    icon: <Key size={11} />,
  },
  CREATE_SUBSCRIPTION: {
    bg: "bg-success-surface", text: "text-success-ink", border: "border-success-border",
    icon: <Key size={11} />,
  },
  CANCEL_SUBSCRIPTION: {
    bg: "bg-error-surface", text: "text-error-ink", border: "border-error-border",
    icon: <Key size={11} />,
  },
  CREATE_SESSION_NOTE: {
    bg: "bg-info-surface", text: "text-info-ink", border: "border-info-border",
    icon: <Key size={11} />,
  },
  UPDATE_SESSION_NOTE: {
    bg: "bg-info-surface", text: "text-info-ink", border: "border-info-border",
    icon: <Key size={11} />,
  },
  VERIFY_QR: {
    bg: "bg-role-trainer-bg", text: "text-role-trainer-text", border: "border-role-trainer-border",
    icon: <Key size={11} />,
  },
};

export default async function LogsPage() {
  const ctx = await requireAuth();
  const isAdmin = await hasAdminRole(ctx.user.id);

  if (!isAdmin) {
    return (
      <div className="glass-card px-8 py-12 text-center animate-fade-in">
        <AlertCircle size={32} className="text-error mx-auto mb-4 opacity-75" />
        <h2 className="text-lg font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Anda tidak memiliki izin (role ADMIN) untuk mengakses Audit Log.
        </p>
      </div>
    );
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
          <ClipboardList size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted text-sm mt-0.5">
            Riwayat aktivitas sistem — 100 entri terbaru
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted text-[11px] uppercase tracking-wider">
                <th className="text-left px-5 py-3.5 font-semibold">Waktu</th>
                <th className="text-left px-5 py-3.5 font-semibold">Pelaku</th>
                <th className="text-left px-5 py-3.5 font-semibold">Aktivitas</th>
                <th className="text-left px-5 py-3.5 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted text-sm">
                    Belum ada aktivitas tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const style = ACTION_STYLES[log.action] || ACTION_STYLES.VERIFY_QR;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-muted whitespace-nowrap">
                        {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <User size={12} className="text-muted" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-xs">
                              {log.actor.fullName}
                            </p>
                            <p className="text-[10px] text-muted">{log.actor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {style.icon}
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted max-w-xs truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
