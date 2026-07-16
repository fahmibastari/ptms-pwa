"use server";

import { createClient } from "@/lib/supabase/server";
import { getRequestMeta, isLoginRateLimited, recordLoginAttempt } from "@/lib/rate-limit";

export async function requestPasswordReset(
  prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "Email wajib diisi." };
  }

  const { ipAddress, userAgent } = await getRequestMeta();

  if (await isLoginRateLimited(email, ipAddress, 3)) {
    return { error: "Terlalu banyak permintaan. Coba lagi dalam 1 menit." };
  }

  const supabase = await createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    await recordLoginAttempt(`reset:${email}`, ipAddress, userAgent, false);
    return { error: "Gagal mengirim email reset. Periksa alamat email Anda." };
  }

  await recordLoginAttempt(`reset:${email}`, ipAddress, userAgent, true);
  return {
    success: "Jika email terdaftar, link reset password telah dikirim. Periksa inbox Anda.",
  };
}
