"use client";

import { useState, useEffect, useTransition } from "react";
import { updateUserRole } from "@/lib/actions/auth";
import {
  getPackages,
  createPackage,
  deletePackage,
  getMembersWithSubscriptions,
  createMemberSubscription,
  updateSubscriptionSessions,
} from "@/lib/actions/packages";
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
  Settings,
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
  ADMIN: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  TRAINER: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  MEMBER: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

export function AdminView({ initialUsers }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"users" | "packages" | "subscriptions">("users");
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

  // Subscriptions/Members state
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [loadingData, setLoadingData] = useState(false);

  // Fetch functions
  const fetchPackagesData = async () => {
    setLoadingData(true);
    const res = await getPackages();
    if (res.success && res.packages) {
      setPackages(res.packages);
    }
    setLoadingData(false);
  };

  const fetchMembersData = async () => {
    setLoadingData(true);
    const res = await getMembersWithSubscriptions();
    if (res.success && res.members) {
      setMembers(res.members);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (activeTab === "packages") {
      fetchPackagesData();
    } else if (activeTab === "subscriptions") {
      fetchMembersData();
      fetchPackagesData();
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

    if (res.error) {
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

    if (res.error) {
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

    if (res.error) {
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

    if (res.error) {
      setError(res.error);
    } else {
      fetchMembersData();
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
      <div className="flex gap-2 border-b border-white/[0.06] pb-px">
        <button
          onClick={() => {
            setActiveTab("users");
            setError(null);
            setSuccess(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "users"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-white"
          }`}
        >
          <Users size={14} />
          User & Role
        </button>
        <button
          onClick={() => {
            setActiveTab("packages");
            setError(null);
            setSuccess(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "packages"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-white"
          }`}
        >
          <Dumbbell size={14} />
          Master Paket
        </button>
        <button
          onClick={() => {
            setActiveTab("subscriptions");
            setError(null);
            setSuccess(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "subscriptions"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-white"
          }`}
        >
          <UserCheck size={14} />
          Langganan Member
        </button>
      </div>

      {/* ── Feedback Messages ── */}
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
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted/60 focus:outline-none focus:border-accent/40 transition-colors"
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
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Pengguna</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
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
      )}

      {/* ── TAB 2: MASTER PAKET ── */}
      {activeTab === "packages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Package Form */}
          <div className="glass-card p-5 h-fit space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
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
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-muted/50 focus:outline-none focus:border-accent/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Harga (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1500000"
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-muted/50 focus:outline-none focus:border-accent/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Jumlah Sesi</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10"
                    value={newPkgSessions}
                    onChange={(e) => setNewPkgSessions(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-muted/50 focus:outline-none focus:border-accent/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Masa Aktif (Bulan)</label>
                <input
                  type="number"
                  placeholder="Contoh: 1"
                  value={newPkgDuration}
                  onChange={(e) => setNewPkgDuration(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-muted/50 focus:outline-none focus:border-accent/40"
                />
              </div>
              <button
                type="submit"
                disabled={loadingData}
                className="w-full py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingData ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                Simpan Master Paket
              </button>
            </form>
          </div>

          {/* Master Packages Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Daftar Master Paket</h3>
              <button
                onClick={fetchPackagesData}
                className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-muted hover:text-white transition-colors cursor-pointer"
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
                      <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Nama Paket</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Sesi</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Durasi</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Harga</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {packages.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3 font-medium text-white">{pkg.name}</td>
                          <td className="px-5 py-3 text-muted">{pkg.sessions} Sesi</td>
                          <td className="px-5 py-3 text-muted">{pkg.durationMonths} Bulan</td>
                          <td className="px-5 py-3 text-muted">
                            Rp {parseFloat(pkg.price).toLocaleString("id-ID")}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDeletePackage(pkg.id)}
                              disabled={loadingData}
                              className="p-1.5 rounded hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
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
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserCheck size={16} className="text-accent" />
              Aktifkan Paket Member
            </h3>
            <form onSubmit={handleAssignPackage} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Pilih Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent/40"
                >
                  <option value="" className="bg-[#0c0c14] text-muted">-- Pilih Member --</option>
                  {users
                    .filter((u) => u.roles.some((r) => r.role === "MEMBER"))
                    .map((member) => (
                      <option key={member.id} value={member.id} className="bg-[#0c0c14] text-white">
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
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent/40"
                >
                  <option value="" className="bg-[#0c0c14] text-muted">-- Pilih Paket --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id} className="bg-[#0c0c14] text-white">
                      {pkg.name} ({pkg.sessions} Sesi - {pkg.durationMonths} Bln)
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loadingData}
                className="w-full py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingData ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                Aktifkan Langganan
              </button>
            </form>
          </div>

          {/* Members Subscription List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Kuota Sesi Langganan Member</h3>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Cari member..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md pl-7 pr-3 py-1.5 text-[11px] text-white placeholder:text-muted/60 focus:outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
                <button
                  onClick={fetchMembersData}
                  className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-muted hover:text-white transition-colors cursor-pointer"
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
                      <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Member</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Paket Aktif</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Kuota Sesi</th>
                        <th className="px-5 py-3 font-semibold text-muted uppercase tracking-wider">Masa Berlaku</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredMembers.map((member) => {
                        const activeSub = member.subscriptions.find((s: any) => s.status === "ACTIVE");
                        return (
                          <tr key={member.id} className="hover:bg-white/[0.02]">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-white">{member.fullName}</p>
                              <p className="text-[10px] text-muted">{member.email}</p>
                            </td>
                            <td className="px-5 py-4">
                              {activeSub ? (
                                <span className="text-white font-medium">{activeSub.packageName}</span>
                              ) : (
                                <span className="text-red-400 text-[10px] border border-red-500/25 bg-red-500/10 px-2 py-0.5 rounded">
                                  Tidak ada paket aktif
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {activeSub ? (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleUpdateSessions(activeSub.id, activeSub.remainingSessions - 1)}
                                    disabled={activeSub.remainingSessions <= 0}
                                    className="w-6 h-6 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white flex items-center justify-center font-bold border border-white/[0.06] cursor-pointer disabled:opacity-30"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-sm text-white w-8 text-center">
                                    {activeSub.remainingSessions}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateSessions(activeSub.id, activeSub.remainingSessions + 1)}
                                    className="w-6 h-6 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white flex items-center justify-center font-bold border border-white/[0.06] cursor-pointer"
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
                                <div>
                                  <p className="text-muted text-[10px]">
                                    Hingga: {new Date(activeSub.endDate).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
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
    </div>
  );
}
