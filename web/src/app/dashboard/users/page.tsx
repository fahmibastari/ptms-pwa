import { prisma } from "@/lib/prisma";
import { requireAuth, hasAdminRole } from "@/lib/auth";
import { AdminView } from "../admin-view";
import { AlertCircle } from "lucide-react";

export default async function UsersPage() {
  const ctx = await requireAuth();
  const isAdmin = await hasAdminRole(ctx.user.id);

  if (!isAdmin) {
    return (
      <div className="glass-card px-8 py-12 text-center animate-fade-in">
        <AlertCircle size={32} className="text-error mx-auto mb-4 opacity-75" />
        <h2 className="text-lg font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Anda tidak memiliki izin (role ADMIN) untuk mengakses halaman manajemen user ini.
        </p>
      </div>
    );
  }

  const allUsers = await prisma.user.findMany({
    include: {
      roles: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
        <p className="text-muted text-sm mt-1">
          Kelola wewenang, role, dan akun pengguna terdaftar secara langsung.
        </p>
      </div>

      <AdminView initialUsers={allUsers} />
    </div>
  );
}
