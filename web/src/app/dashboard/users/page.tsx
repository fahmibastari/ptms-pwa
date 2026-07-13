import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminView } from "../admin-view";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user roles to verify Admin authorization
  const dbRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    select: { role: true },
  });

  const availableRoles = dbRoles.map((r) => r.role);
  const activeRole = user.user_metadata?.active_role || availableRoles[0] || "MEMBER";

  // Strict route protection
  if (activeRole !== "ADMIN") {
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

  // Fetch all users with their roles for the Admin view
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
