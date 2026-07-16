"use client";

import { useState, useEffect, useTransition } from "react";
import { updateUserRole } from "@/lib/actions/auth";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getMembersWithSubscriptions,
  createMemberSubscription,
  cancelSubscription,
  updateSubscriptionSessions,
} from "@/lib/actions/packages";
import {
  getTrainerAssignments,
  assignMemberToTrainer,
} from "@/lib/actions/trainers";
import {
  Search,
  ShieldCheck,
  X,
  Plus,
  UserCircle,
  Dumbbell,
  UserCheck,
  Trash2,
  RefreshCw,
  Users,
  Link2,
  Pencil,
  Check,
  Ban,
  UserMinus,
} from "lucide-react";

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
  ADMIN:   { bg: "bg-role-admin-bg",   text: "text-role-admin-text",   border: "border-role-admin-border" },
  TRAINER: { bg: "bg-role-trainer-bg", text: "text-role-trainer-text", border: "border-role-trainer-border" },
  MEMBER:  { bg: "bg-role-member-bg",  text: "text-role-member-text",  border: "border-role-member-border" },
};

export function AdminView({ initialUsers }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<
    "users" | "packages" | "subscriptions" | "assignments"
  >("users");
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Packages state
  const [packages, setPackages] = useState<any[]>([]);
  const [newPkgName, setNewPkgName] = useState("");
  const [newPkgPrice, setNewPkgPrice] = useState("");
  const [newPkgSessions, setNewPkgSessions] = useState("");
  const [newPkgDuration, setNewPkgDuration] = useState("");

  // Inline package edit state
  const [editingPkgId, setEditingPkgId] = useState<number | null>(null);
  const [editPkg, setEditPkg] = useState({ name: "", price: "", sessions: "", durationMonths: "" });

  // Subscriptions/Members state
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [loadingData, setLoadingData] = useState(false);

  // Trainer assignment state
  const [trainers, setTrainers] = useState<any[]>([]);
  const [assignmentMembers, setAssignmentMembers] = useState<any[]>([]);
  const [assignMemberUserId, setAssignMemberUserId] = useState("");
  const [assignTrainerUserId, setAssignTrainerUserId] = useState("");

  // Fetch functions
  const fetchPackagesData = async () => {
    setLoadingData(true);
    const res = await getPackages();
    if ("success" in res && res.success && res.packages) {
      setPackages(res.packages);
    }
    setLoadingData(false);
  };

  const fetchMembersData = async () => {
    setLoadingData(true);
    const res = await getMembersWithSubscriptions();
    if ("success" in res && res.success && res.members) {
      setMembers(res.members);
    }
    setLoadingData(false);
  };

  const fetchAssignmentsData = async () => {
    setLoadingData(true);
    const res = await getTrainerAssignments();
    if ("success" in res && res.success) {
      setTrainers(res.trainers ?? []);
      setAssignmentMembers(res.allMembers ?? []);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (activeTab === "packages") {
      fetchPackagesData();
    } else if (activeTab === "subscriptions") {
      fetchMembersData();
      fetchPackagesData();
    } else if (activeTab === "assignments") {
      fetchAssignmentsData();
    }
  }, [activeTab]);

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

  // Create Gym Package
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPkgName || !newPkgPrice || !newPkgSessions || !newPkgDuration) {
      setError("Semua field master paket wajib diisi.");
      return;
    }

    setLoadingData(true);
    const res = await createPackage({
      name: newPkgName,
      price: parseFloat(newPkgPrice),
      sessions: parseInt(newPkgSessions),
      durationMonths: parseInt(newPkgDuration),
    });
    setLoadingData(false);

    if ("error" in res && res.error) {
      setError(res.error);
    } else {
      setSuccess(`Master paket "${newPkgName}" berhasil dibuat.`);
      setNewPkgName("");
      setNewPkgPrice("");
      setNewPkgSessions("");
      setNewPkgDuration("");
      fetchPackagesData();
    }
  };

  // Delete Gym Package
  const handleDeletePackage = async (id: number) => {
    setError(null);
    setSuccess(null);
    if (!confirm("Apakah Anda yakin ingin menghapus master paket ini?")) return;

    setLoadingData(true);
    const res = await deletePackage(id);
    setLoadingData(false);

    if ("error" in res && res.error) {
      setError(res.error);
    } else {
      setSuccess("Master paket berhasil dihapus.");
      fetchPackagesData();
    }
  };

  // Assign Package to Member
  const handleAssignPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedMemberId || !selectedPackageId) {
      setError("Silakan pilih member dan paket terlebih dahulu.");
      return;
    }

    setLoadingData(true);
    const res = await createMemberSubscription(selectedMemberId, parseInt(selectedPackageId));
    setLoadingData(false);

    if ("error" in res && res.error) {
      setError(res.error);
    } else {
      setSuccess("Paket latihan berhasil diaktifkan untuk member.");
      setSelectedMemberId("");
      setSelectedPackageId("");
      fetchMembersData();
    }
  };

  // Update Remaining Sessions Count
  const handleUpdateSessions = async (subId: string, newSessions: number) => {
    setError(null);
    setSuccess(null);

    setLoadingData(true);
    const res = await updateSubscriptionSessions(subId, newSessions);
    setLoadingData(false);

    if ("error" in res && res.error) {
      setError(res.error);
    } else {
      fetchMembersData();
    }
  };

  const handleAssignTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!assignMemberUserId) {
      setError("Silakan pilih member terlebih dahulu.");
      return;
    }

    setLoadingData(true);
    const res = await assignMemberToTrainer(
      assignMemberUserId,
      assignTrainerUserId || null
    );
    setLoadingData(false);

    if ("error" in res && res.error) {
      setError(res.error);
    } else {
      setSuccess(
        assignTrainerUserId
          ? "Trainer berhasil di-assign ke member."
          : "Assignment trainer berhasil dicabut."
      );
      setAssignMemberUserId("");
      setAssignTrainerUserId("");
      fetchAssignmentsData();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // Inline edit package helpers
  const startEditPackage = (pkg: any) => {
    setEditingPkgId(pkg.id);
    setEditPkg({
      name: pkg.name,
      price: String(pkg.price),
      sessions: String(pkg.sessions),
      durationMonths: String(pkg.durationMonths),
    });
  };

  const handleSavePackage = async () => {
    if (!editingPkgId) return;
    setError(null);
    setSuccess(null);
    setLoadingData(true);
    const res = await updatePackage(editingPkgId, {
      name: editPkg.name,
      price: parseFloat(editPkg.price),
      sessions: parseInt(editPkg.sessions),
      durationMonths: parseInt(editPkg.durationMonths),
    });
    setLoadingData(false);
    if ("error" in res && res.error) {
      setError(res.error);
    } else {
      setSuccess("Paket berhasil diupdate.");
      setEditingPkgId(null);
      fetchPackagesData();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async (subId: string, memberName: string) => {
    if (!confirm(`Batalkan langganan aktif milik ${memberName}? Sisa sesi akan hangus.`)) return;
    setError(null);
    setSuccess(null);
    setLoadingData(true);
    const res = await cancelSubscription(subId);
    setLoadingData(false);
    if ("error" in res && res.error) {
      setError(res.error);
    } else {
      setSuccess(`Langganan ${memberName} berhasil dibatalkan.`);
      fetchMembersData();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // Per-row unassign trainer
  const handleUnassignTrainer = async (memberUserId: string, memberName: string) => {
    if (!confirm(`Cabut assignment trainer dari ${memberName}?`)) return;
    setError(null);
    setSuccess(null);
    setLoadingData(true);
    const res = await assignMemberToTrainer(memberUserId, null);
    setLoadingData(false);
    if ("error" in res && res.error) {
      setError(res.error);
    } else {
      setSuccess(`Trainer berhasil dicabut dari ${memberName}.`);
      fetchAssignmentsData();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const allRoles = ["MEMBER", "TRAINER", "ADMIN"];

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* ── Tabs Navigation ── */}
      <div className="flex gap-2 border-b border-card-border pb-px overflow-x-auto">
        {(["users", "packages", "subscriptions", "assignments"] as const).map((tab) => {
          const labels: Record<string, { label: string; icon: React.ReactNode }> = {
            users:         { label: "User & Role",       icon: <Users size={14} /> },
            packages:      { label: "Master Paket",      icon: <Dumbbell size={14} /> },
            subscriptions: { label: "Langganan Member",  icon: <UserCheck size={14} /> },
            assignments:   { label: "Assign Trainer",    icon: <Link2 size={14} /> },
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(null); setSuccess(null); }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {labels[tab].icon}
              {labels[tab].label}
            </button>
          );
        })}
      </div>

      {/* ── Feedback Messages ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in">
          <X size={14} className="shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-success-border bg-success-surface px-4 py-3 text-sm text-success-ink animate-fade-in">
          <ShieldCheck size={14} className="shrink-0" />
          {success}
        </div>
      )}

      {/* ── TAB 1: USERS & ROLES ── */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Manajemen User & Role</h2>
              <p className="text-muted text-xs mt-0.5">{users.length} pengguna terdaftar</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="auth-input pl-9 text-sm"
              />
            </div>
          </div>

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
                    <tr className="border-b border-card-border">
                      <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Pengguna</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-muted font-semibold text-xs">
                              {(user.fullName?.[0] || user.email[0]).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {user.fullName || "Pengguna Baru"}
                              </p>
                              <p className="text-[11px] text-muted truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
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
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                    hasRole
                                      ? `${s.bg} ${s.text} border ${s.border} hover:opacity-70`
                                      : "bg-gray-50 text-muted border border-gray-200 hover:bg-gray-100 hover:text-foreground"
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
      )}

      {/* ── TAB 2: MASTER PAKET ── */}
      {activeTab === "packages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Package Form */}
          <div className="glass-card p-5 h-fit space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Plus size={16} className="text-accent" />
              Tambah Master Paket
            </h3>
            <form onSubmit={handleCreatePackage} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Nama Paket</label>
                <input
                  type="text"
                  placeholder="Contoh: Paket 10 Sesi PT"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  className="auth-input text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Harga (Rp)</label>
                  <input
                    type="number"
                    placeholder="1500000"
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(e.target.value)}
                    className="auth-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Jumlah Sesi</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={newPkgSessions}
                    onChange={(e) => setNewPkgSessions(e.target.value)}
                    className="auth-input text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Masa Aktif (Bulan)</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newPkgDuration}
                  onChange={(e) => setNewPkgDuration(e.target.value)}
                  className="auth-input text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={loadingData}
                className="btn-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loadingData ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                Simpan Master Paket
              </button>
            </form>
          </div>

          {/* Master Packages Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Daftar Master Paket</h3>
              <button
                onClick={fetchPackagesData}
                className="p-1.5 rounded bg-gray-50 border border-gray-200 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {loadingData && packages.length === 0 ? (
              <div className="glass-card py-12 text-center text-muted text-xs flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Memuat data paket...
              </div>
            ) : packages.length === 0 ? (
              <div className="glass-card py-12 text-center text-muted text-xs">
                Belum ada master paket. Tambahkan paket di sebelah kiri.
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-card-border bg-gray-50">
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Nama Paket</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Sesi</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Durasi</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Harga</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {packages.map((pkg) =>
                        editingPkgId === pkg.id ? (
                          // ── Inline edit row ──
                          <tr key={pkg.id} className="bg-blue-50/60">
                            <td className="px-3 py-2">
                              <input
                                className="auth-input text-xs py-1"
                                value={editPkg.name}
                                onChange={(e) => setEditPkg((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Nama paket"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                className="auth-input text-xs py-1 w-20"
                                value={editPkg.sessions}
                                onChange={(e) => setEditPkg((p) => ({ ...p, sessions: e.target.value }))}
                                min={1}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                className="auth-input text-xs py-1 w-20"
                                value={editPkg.durationMonths}
                                onChange={(e) => setEditPkg((p) => ({ ...p, durationMonths: e.target.value }))}
                                min={1}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                className="auth-input text-xs py-1 w-28"
                                value={editPkg.price}
                                onChange={(e) => setEditPkg((p) => ({ ...p, price: e.target.value }))}
                                min={0}
                                step={1000}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={handleSavePackage}
                                  disabled={loadingData}
                                  title="Simpan"
                                  className="p-1.5 rounded bg-success-surface hover:bg-success-border text-success-ink border border-success-border cursor-pointer"
                                  style={{ transition: "background-color var(--dur-short) var(--ease-out)" }}
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  onClick={() => setEditingPkgId(null)}
                                  title="Batal"
                                  className="p-1.5 rounded bg-gray-50 hover:bg-gray-100 text-muted border border-gray-200 transition-colors cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          // ── Normal display row ──
                          <tr key={pkg.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-foreground">{pkg.name}</td>
                            <td className="px-5 py-3 text-muted">{pkg.sessions} Sesi</td>
                            <td className="px-5 py-3 text-muted">{pkg.durationMonths} Bulan</td>
                            <td className="px-5 py-3 text-muted">
                              Rp {parseFloat(pkg.price).toLocaleString("id-ID")}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => startEditPackage(pkg)}
                                  disabled={loadingData}
                                  title="Edit paket"
                                  className="p-1.5 rounded hover:bg-blue-50 text-blue-500 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeletePackage(pkg.id)}
                                  disabled={loadingData}
                                  title="Hapus paket"
                                  className="p-1.5 rounded hover:bg-red-50 text-red-400 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: MEMBER SUBSCRIPTION & SESSION QUOTAS ── */}
      {activeTab === "subscriptions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assign Package to Member */}
          <div className="glass-card p-5 h-fit space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserCheck size={16} className="text-accent" />
              Aktifkan Paket Member
            </h3>
            <form onSubmit={handleAssignPackage} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Pilih Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="auth-input text-xs"
                >
                  <option value="">-- Pilih Member --</option>
                  {users
                    .filter((u) => u.roles.some((r) => r.role === "MEMBER"))
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName || "Unnamed"} ({member.email})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Pilih Paket Master</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="auth-input text-xs"
                >
                  <option value="">-- Pilih Paket --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.sessions} Sesi - {pkg.durationMonths} Bln)
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loadingData}
                className="btn-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loadingData ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                Aktifkan Langganan
              </button>
            </form>
          </div>

          {/* Members Subscription List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Kuota Sesi Langganan Member</h3>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Cari member..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="auth-input pl-7 text-[11px]"
                  />
                </div>
                <button
                  onClick={fetchMembersData}
                  className="p-1.5 rounded bg-gray-50 border border-gray-200 text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            {loadingData && members.length === 0 ? (
              <div className="glass-card py-12 text-center text-muted text-xs flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Memuat data langganan...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="glass-card py-12 text-center text-muted text-xs">
                Tidak ada member ditemukan.
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-card-border bg-gray-50">
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Member</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Paket Aktif</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Kuota Sesi</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Masa Berlaku</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMembers.map((member) => {
                        const activeSub = member.subscriptions.find((s: any) => s.status === "ACTIVE");
                        return (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-foreground">{member.fullName}</p>
                              <p className="text-[10px] text-muted">{member.email}</p>
                            </td>
                            <td className="px-5 py-4">
                              {activeSub ? (
                                <span className="text-foreground font-medium">{activeSub.packageName}</span>
                              ) : (
                                <span className="text-red-700 text-[10px] border border-red-200 bg-red-50 px-2 py-0.5 rounded">
                                  Tidak ada paket aktif
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {activeSub ? (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleUpdateSessions(activeSub.id, activeSub.remainingSessions - 1)}
                                    disabled={activeSub.remainingSessions <= 0 || loadingData}
                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-foreground flex items-center justify-center font-bold border border-gray-200 cursor-pointer disabled:opacity-30"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-sm text-foreground w-8 text-center">
                                    {activeSub.remainingSessions}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateSessions(activeSub.id, activeSub.remainingSessions + 1)}
                                    disabled={loadingData}
                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-foreground flex items-center justify-center font-bold border border-gray-200 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted font-mono">-</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {activeSub ? (
                                <p className="text-muted text-[10px]">
                                  Hingga: {new Date(activeSub.endDate).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              {activeSub && (
                                <button
                                  onClick={() => handleCancelSubscription(activeSub.id, member.fullName)}
                                  disabled={loadingData}
                                  title="Batalkan langganan aktif"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Ban size={11} />
                                  Batalkan
                                </button>
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
        </div>
      )}

      {/* ── TAB 4: TRAINER ASSIGNMENTS ── */}
      {activeTab === "assignments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-5 h-fit space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Link2 size={16} className="text-accent" />
              Assign Member ke Trainer
            </h3>
            <form onSubmit={handleAssignTrainer} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                  Pilih Member
                </label>
                <select
                  value={assignMemberUserId}
                  onChange={(e) => setAssignMemberUserId(e.target.value)}
                  className="auth-input text-xs"
                >
                  <option value="">-- Pilih Member --</option>
                  {assignmentMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                  Pilih Trainer
                </label>
                <select
                  value={assignTrainerUserId}
                  onChange={(e) => setAssignTrainerUserId(e.target.value)}
                  className="auth-input text-xs"
                >
                  <option value="">-- Cabut Assignment --</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.userId} value={trainer.userId}>
                      {trainer.fullName} ({trainer.memberCount} member)
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loadingData}
                className="btn-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loadingData ? <RefreshCw size={12} className="animate-spin" /> : <Link2 size={12} />}
                Simpan Assignment
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Daftar Assignment</h3>
              <button
                onClick={fetchAssignmentsData}
                className="p-1.5 rounded bg-gray-50 border border-gray-200 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {loadingData && trainers.length === 0 ? (
              <div className="glass-card py-12 text-center text-muted text-xs flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Memuat assignment...
              </div>
            ) : trainers.length === 0 ? (
              <div className="glass-card py-12 text-center text-muted text-xs">
                Belum ada trainer terdaftar. Tambahkan role TRAINER ke user terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-4">
                {trainers.map((trainer) => (
                  <div key={trainer.id} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{trainer.fullName}</p>
                        <p className="text-[10px] text-muted">{trainer.email}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2 py-1 rounded">
                        {trainer.memberCount} member
                      </span>
                    </div>
                    {trainer.members.length === 0 ? (
                      <p className="text-xs text-muted">Belum ada member di-assign.</p>
                    ) : (
                      <ul className="space-y-2">
                        {trainer.members.map((member: any) => (
                          <li
                            key={member.id}
                            className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{member.fullName}</p>
                              <p className="text-muted text-[10px] truncate">{member.email}</p>
                            </div>
                            <button
                              onClick={() => handleUnassignTrainer(member.userId, member.fullName)}
                              disabled={loadingData}
                              title="Cabut assignment trainer"
                              className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <UserMinus size={10} />
                              Cabut
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
