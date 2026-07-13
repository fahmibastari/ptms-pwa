"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/lib/actions/auth";

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

      setSuccess(`Berhasil ${hasRole ? "mencabut" : "memberi"} role ${role}.`);
      setTimeout(() => setSuccess(null), 3000);
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const allRoles = ["MEMBER", "TRAINER", "ADMIN"];

  return (
    <div className="space-y-8">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Manajemen Pengguna</h2>
          <p className="text-muted text-sm mt-1">
            {users.length} pengguna terdaftar
          </p>
        </div>
        <input
          type="text"
          placeholder="Cari nama atau email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      {/* ── Toast Feedback ── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3.5 text-sm text-red-400 animate-fade-in">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-success/20 bg-success/5 px-5 py-3.5 text-sm text-success animate-fade-in">
          ✅ {success}
        </div>
      )}

      {/* ── User Cards Grid ── */}
      {filteredUsers.length === 0 ? (
        <div className="glass-card px-8 py-16 text-center">
          <p className="text-muted">Tidak ada pengguna ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredUsers.map((user) => (
            <div key={user.id} className="glass-card px-7 py-6 flex flex-col gap-5">
              {/* User Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Avatar */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                    {(user.fullName?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {user.fullName || "Trainee Baru"}
                    </p>
                    <p className="text-muted text-xs mt-0.5 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Current Roles */}
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((r) => {
                  const s = ROLE_STYLES[r.role] || ROLE_STYLES.MEMBER;
                  return (
                    <span
                      key={r.id}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}
                    >
                      {r.role}
                    </span>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Role Toggle Buttons */}
              <div className="flex flex-wrap gap-2">
                {allRoles.map((role) => {
                  const hasRole = user.roles.some((r) => r.role === role);
                  const s = ROLE_STYLES[role] || ROLE_STYLES.MEMBER;
                  return (
                    <button
                      key={role}
                      disabled={isPending}
                      onClick={() => handleRoleToggle(user.id, role, hasRole)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        hasRole
                          ? `${s.bg} ${s.text} border ${s.border} hover:opacity-70`
                          : "bg-white/5 text-muted border border-white/8 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {hasRole ? `✕ Cabut ${role}` : `+ Beri ${role}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
