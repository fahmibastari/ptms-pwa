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
    return { error: "Email atau password salah." };
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
    return { error: "Gagal mendaftar. Coba lagi." };
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

