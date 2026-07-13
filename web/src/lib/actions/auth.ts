"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: `Login gagal: ${error.message}` };
  }

  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!fullName || !email || !password) {
    return { error: "Semua field wajib diisi." };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  if (password !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Email sudah terdaftar." };
    }
    return { error: `Gagal mendaftar: ${error.message}` };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function switchRole(role: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Silakan login terlebih dahulu." };
  }

  // We check the role from the prisma database userRole mapping
  const { prisma } = await import("@/lib/prisma");
  const { Role } = await import("@/generated/prisma");

  const validRole = role as any; // Cast safely for prisma query

  const userRole = await prisma.userRole.findUnique({
    where: {
      userId_role: {
        userId: user.id,
        role: validRole,
      },
    },
  });

  if (!userRole) {
    return { error: "Anda tidak memiliki akses ke role ini." };
  }

  // Update active_role inside user metadata in Supabase
  const { error } = await supabase.auth.updateUser({
    data: {
      active_role: role,
    },
  });

  if (error) {
    return { error: "Gagal mengganti role. Coba lagi." };
  }

  redirect("/dashboard");
}

export async function updateUserRole(targetUserId: string, role: string, action: "ADD" | "REMOVE") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Silakan login terlebih dahulu." };
  }

  const { prisma } = await import("@/lib/prisma");
  const { Role } = await import("@/generated/prisma");

  // 1. Verify the requester is an ADMIN
  const adminCheck = await prisma.userRole.findUnique({
    where: {
      userId_role: {
        userId: user.id,
        role: Role.ADMIN,
      },
    },
  });

  if (!adminCheck) {
    return { error: "Hanya Admin yang memiliki otorisasi untuk mengubah role." };
  }

  // Prevent admin from removing their own ADMIN role
  if (targetUserId === user.id && role === "ADMIN" && action === "REMOVE") {
    return { error: "Anda tidak dapat menghapus akses Admin Anda sendiri." };
  }

  const targetRole = role as any;

  try {
    if (action === "ADD") {
      await prisma.userRole.upsert({
        where: {
          userId_role: {
            userId: targetUserId,
            role: targetRole,
          },
        },
        update: {},
        create: {
          userId: targetUserId,
          role: targetRole,
        },
      });
    } else {
      // Check that the user has at least one role left
      const roleCount = await prisma.userRole.count({
        where: { userId: targetUserId },
      });

      if (roleCount <= 1) {
        return { error: "Pengguna harus memiliki minimal satu peran (role)." };
      }

      await prisma.userRole.delete({
        where: {
          userId_role: {
            userId: targetUserId,
            role: targetRole,
          },
        },
      });
    }
    return { success: true };
  } catch (err: any) {
    return { error: `Gagal memperbarui role: ${err.message}` };
  }
}


