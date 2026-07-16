import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getRequestMeta() {
  const h = await headers();
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const userAgent = h.get("user-agent") || undefined;
  return { ipAddress, userAgent };
}

export async function isLoginRateLimited(
  email: string,
  ipAddress: string,
  limit = 5,
  windowMs = 60_000
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const attempts = await prisma.loginAttempt.count({
    where: {
      OR: [{ email }, { ipAddress }],
      success: false,
      failedAt: { gte: since },
    },
  });
  return attempts >= limit;
}

export async function isRegisterRateLimited(
  ipAddress: string,
  limit = 3,
  windowMs = 60_000
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const attempts = await prisma.loginAttempt.count({
    where: {
      ipAddress,
      email: { endsWith: "@register" },
      failedAt: { gte: since },
    },
  });
  return attempts >= limit;
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string | undefined,
  success: boolean
) {
  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress,
      userAgent,
      success,
    },
  });
}

export async function recordRegisterAttempt(
  ipAddress: string,
  userAgent: string | undefined,
  success: boolean
) {
  await prisma.loginAttempt.create({
    data: {
      email: `attempt@${success ? "success" : "fail"}.register`,
      ipAddress,
      userAgent,
      success,
    },
  });
}

export async function isQrGenerateRateLimited(
  userId: string,
  limit = 10,
  windowMs = 60_000
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.qrToken.count({
    where: {
      userId,
      createdAt: { gte: since },
    },
  });
  return count >= limit;
}

export async function isQrVerifyRateLimited(
  userId: string,
  limit = 10,
  windowMs = 60_000
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.auditLog.count({
    where: {
      actorId: userId,
      action: "VERIFY_QR",
      createdAt: { gte: since },
    },
  });
  return count >= limit;
}
