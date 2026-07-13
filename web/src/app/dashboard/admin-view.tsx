"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/lib/actions/auth";
import { Search, ShieldCheck, X, Plus, UserCircle } from "lucide-react";

interface RoleData {
  id: number;
  userId: string;
  role: string;
  createdAt: Date;
}

interface UserData {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: Date;
  roles: RoleData[];
}

interface AdminViewProps {
  initialUsers: UserData[];
}

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  TRAINER: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  MEMBER: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

export function AdminView({ initialUsers }: AdminViewProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRoleToggle = (userId: string, role: string, hasRole: boolean) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const action = hasRole ? "REMOVE" : "ADD";
      const result = await updateUserRole(userId, role, action);

      if (result.error) {
        setError(result.error);
        return;
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const updatedRoles = hasRole
            ? u.roles.filter((r) => r.role !== role)
            : [...u.roles, { id: Date.now(), userId, role, createdAt: new Date() }];
          return { ...u, roles: updatedRoles };
        })
      );

      const userName = users.find((u) => u.id === userId)?.fullName || "User";
      setSuccess(`Role ${role} berhasil ${hasRole ? "dicabut dari" : "diberikan ke"} ${userName}.`);
      setTimeout(() => setSuccess(null), 4000);
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const allRoles = ["MEMBER", "TRAINER", "ADMIN"];

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <ShieldCheck size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Manajemen User</h2>
            <p className="text-muted text-xs mt-0.5">{users.length} pengguna terdaftar</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted/60 focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>
      </div>

      {/* ── Feedback ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-sm text-red-400 animate-fade-in">
          <X size={14} className="shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3 text-sm text-emerald-400 animate-fade-in">
          <ShieldCheck size={14} className="shrink-0" />
          {success}
        </div>
      )}

      {/* ── User Table ── */}
      {filteredUsers.length === 0 ? (
        <div className="glass-card px-6 py-12 text-center">
          <UserCircle size={28} className="text-muted/40 mx-auto mb-3" />
          <p className="text-muted text-sm">Tidak ada pengguna ditemukan.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Pengguna</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-muted font-semibold text-xs">
                          {(user.fullName?.[0] || user.email[0]).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {user.fullName || "Pengguna Baru"}
                          </p>
                          <p className="text-[11px] text-muted truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((r) => {
                          const s = ROLE_STYLES[r.role] || ROLE_STYLES.MEMBER;
                          return (
                            <span
                              key={r.id}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${s.bg} ${s.text} ${s.border}`}
                            >
                              {r.role}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        {allRoles.map((role) => {
                          const hasRole = user.roles.some((r) => r.role === role);
                          const s = ROLE_STYLES[role] || ROLE_STYLES.MEMBER;
                          return (
                            <button
                              key={role}
                              disabled={isPending}
                              onClick={() => handleRoleToggle(user.id, role, hasRole)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                hasRole
                                  ? `${s.bg} ${s.text} border ${s.border} hover:opacity-70`
                                  : "bg-white/[0.03] text-muted border border-white/[0.06] hover:bg-white/[0.06] hover:text-white"
                              }`}
                            >
                              {hasRole ? (
                                <>
                                  <X size={10} /> {role}
                                </>
                              ) : (
                                <>
                                  <Plus size={10} /> {role}
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
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
