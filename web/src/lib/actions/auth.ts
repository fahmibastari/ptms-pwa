"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import {
  getRequestMeta,
  isLoginRateLimited,
  isRegisterRateLimited,
  recordLoginAttempt,
  recordRegisterAttempt,
} from "@/lib/rate-limit";

async function syncUserToPrisma(
  userId: string,
  email: string,
  fullName: string,
  defaultRole: Role = Role.MEMBER
) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email,
      fullName,
    },
    create: {
      id: userId,
      email,
      fullName,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_role: {
        userId,
        role: defaultRole,
      },
    },
    update: {},
    create: {
      userId,
      role: defaultRole,
    },
  });
}

export async function login(prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();
  const { ipAddress, userAgent } = await getRequestMeta();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  if (await isLoginRateLimited(email, ipAddress)) {
    return { error: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await recordLoginAttempt(email, ipAddress, userAgent, false);
    return { error: "Login gagal. Periksa email dan password Anda." };
  }

  await recordLoginAttempt(email, ipAddress, userAgent, true);

  if (data.user) {
    const fullName = data.user.user_metadata?.full_name ?? email.split("@")[0];
    await syncUserToPrisma(data.user.id, data.user.email ?? email, fullName);
  }

  redirect("/dashboard");
}

export async function register(prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();
  const { ipAddress, userAgent } = await getRequestMeta();

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

  if (await isRegisterRateLimited(ipAddress)) {
    return { error: "Terlalu banyak percobaan registrasi. Coba lagi dalam 1 menit." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        active_role: Role.MEMBER,
      },
    },
  });

  if (error) {
    await recordRegisterAttempt(ipAddress, userAgent, false);
    if (error.message.includes("already registered")) {
      return { error: "Email sudah terdaftar." };
    }
    return { error: "Gagal mendaftar. Silakan coba lagi." };
  }

  await recordRegisterAttempt(ipAddress, userAgent, true);

  if (data.user) {
    await syncUserToPrisma(data.user.id, email, fullName, Role.MEMBER);
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

  const validRoles = new Set<string>(Object.values(Role));
  if (!validRoles.has(role)) {
    return { error: "Role tidak valid." };
  }

  const targetRole = role as Role;

  const userRole = await prisma.userRole.findUnique({
    where: {
      userId_role: {
        userId: user.id,
        role: targetRole,
      },
    },
  });

  if (!userRole) {
    return { error: "Anda tidak memiliki akses ke role ini." };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      active_role: role,
    },
  });

  if (error) {
    return { error: "Gagal mengganti role. Coba lagi." };
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "SWITCH_ROLE",
      entityType: "USER",
      entityId: user.id,
      metadata: {
        newRole: role,
      },
    },
  });

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

  const validRoles = new Set<string>(Object.values(Role));
  if (!validRoles.has(role)) {
    return { error: "Role tidak valid." };
  }

  const targetRole = role as Role;

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

  if (targetUserId === user.id && role === "ADMIN" && action === "REMOVE") {
    return { error: "Anda tidak dapat menghapus akses Admin Anda sendiri." };
  }

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

      if (targetRole === Role.MEMBER) {
        await prisma.member.upsert({
          where: { userId: targetUserId },
          update: {},
          create: { userId: targetUserId },
        });
      }

      if (targetRole === Role.TRAINER) {
        await prisma.trainer.upsert({
          where: { userId: targetUserId },
          update: {},
          create: { userId: targetUserId },
        });
      }
    } else {
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

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: action === "ADD" ? "ADD_ROLE" : "REMOVE_ROLE",
        entityType: "USER_ROLE",
        entityId: targetUserId,
        metadata: {
          targetUserId,
          role,
          action,
        },
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui role.";
    return { error: `Gagal memperbarui role: ${message}` };
  }
}
