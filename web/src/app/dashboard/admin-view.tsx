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

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id !== userId) return user;

          const updatedRoles = hasRole
            ? user.roles.filter((r) => r.role !== role)
            : [
                ...user.roles,
                {
                  id: Date.now(), // temporary client-side ID
                  userId,
                  role,
                  createdAt: new Date(),
                },
              ];

          return { ...user, roles: updatedRoles };
        })
      );

      setSuccess(
        `Berhasil ${hasRole ? "menghapus" : "menambahkan"} role ${role} untuk pengguna.`
      );
    });
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const allAvailableRoles = ["MEMBER", "TRAINER", "ADMIN"];

  return (
    <div className="space-y-6">
      {/* Action Feedback */}
      {error && (
        <div className="glass-card border-red-500/20 bg-red-500/5 p-4 rounded-xl text-sm text-red-400 animate-fade-in">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="glass-card border-success/20 bg-success/5 p-4 rounded-xl text-sm text-success animate-fade-in">
          ✨ {success}
        </div>
      )}

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Manajemen Pengguna</h2>
          <p className="text-muted text-xs mt-0.5">
            Daftar seluruh user terdaftar. Anda dapat menunjuk Trainer atau Admin di sini.
          </p>
        </div>
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Nama / Email</th>
                <th className="px-6 py-4 font-medium">Peran Aktif (Roles)</th>
                <th className="px-6 py-4 font-medium text-right">Aksi Kelola Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {user.fullName || "Trainee Baru"}
                      </div>
                      <div className="text-muted text-xs mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((r) => (
                          <span
                            key={r.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              r.role === "ADMIN"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : r.role === "TRAINER"
                                ? "bg-accent/10 text-accent border-accent/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {r.role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        {allAvailableRoles.map((role) => {
                          const hasRole = user.roles.some((r) => r.role === role);
                          return (
                            <button
                              key={role}
                              disabled={isPending}
                              onClick={() => handleRoleToggle(user.id, role, hasRole)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isPending ? "opacity-50 cursor-not-allowed" : ""
                              } ${
                                hasRole
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                  : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                              }`}
                            >
                              {hasRole ? `Cabut ${role}` : `Beri ${role}`}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
