"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth";
import { isQrGenerateRateLimited, isQrVerifyRateLimited } from "@/lib/rate-limit";
import { pruneExpiredQrTokens } from "@/lib/qr-cleanup";
import crypto from "crypto";

const TOKEN_REGEX = /^[a-f0-9]{64}$/;

function isValidToken(token: string): boolean {
  return TOKEN_REGEX.test(token);
}

async function ensureMemberProfile(userId: string) {
  let member = await prisma.member.findUnique({
    where: { userId },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
          remainingSessions: { gt: 0 },
        },
      },
      memberships: {
        where: {
          status: "ACTIVE",
          remainingSessions: { gt: 0 },
        },
      },
    },
  });

  if (!member) {
    member = await prisma.member.create({
      data: { userId },
      include: {
        subscriptions: {
          where: {
            status: "ACTIVE",
            remainingSessions: { gt: 0 },
          },
        },
        memberships: {
          where: {
            status: "ACTIVE",
            remainingSessions: { gt: 0 },
          },
        },
      },
    });
  }

  return member;
}

async function ensureTrainerProfile(userId: string) {
  let trainer = await prisma.trainer.findUnique({
    where: { userId },
  });

  if (!trainer) {
    trainer = await prisma.trainer.create({
      data: { userId },
    });
  }

  return trainer;
}

function canTrainerVerifyMember(
  trainer: { id: string; assignedMemberIds: string[] },
  member: { id: string; trainerId: string | null }
): boolean {
  if (member.trainerId === null) {
    return true;
  }
  if (member.trainerId === trainer.id) {
    return true;
  }
  return trainer.assignedMemberIds.includes(member.id);
}

/**
 * Generates a secure, short-lived QR token for the authenticated member.
 */
export async function generateQrToken() {
  const ctx = await requireAuth();

  if (!ctx.availableRoles.includes(Role.MEMBER)) {
    return { error: "Hanya akun dengan role MEMBER yang dapat menghasilkan QR Code." };
  }

  if (ctx.activeRole !== Role.MEMBER) {
    return { error: "Silakan aktifkan role MEMBER terlebih dahulu untuk menghasilkan QR Code." };
  }

  if (await isQrGenerateRateLimited(ctx.user.id)) {
    return { error: "Terlalu banyak permintaan QR. Tunggu sebentar lalu coba lagi." };
  }

  await pruneExpiredQrTokens();

  const member = await ensureMemberProfile(ctx.user.id);
  const hasActiveSubscription = member.subscriptions.length > 0;
  const hasActiveMembership = member.memberships.length > 0;

  if (!hasActiveSubscription && !hasActiveMembership) {
    return {
      error: "Anda tidak memiliki paket aktif. Silakan hubungi Admin untuk mengaktifkan langganan.",
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 1000);

  try {
    const qrRecord = await prisma.qrToken.create({
      data: {
        userId: ctx.user.id,
        token,
        expiresAt,
      },
    });

    return {
      success: true,
      token: qrRecord.token,
      expiresAt: qrRecord.expiresAt.toISOString(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat QR token.";
    return { error: `Gagal membuat QR token: ${message}` };
  }
}

/**
 * Verifies a scanned QR token, records attendance, and reduces session count atomically.
 */
export async function verifyQrToken(token: string) {
  if (!isValidToken(token)) {
    return { error: "Format QR Code tidak valid." };
  }

  const ctx = await requireAuth();

  if (!ctx.availableRoles.includes(Role.TRAINER)) {
    return { error: "Hanya akun dengan role TRAINER yang dapat melakukan verifikasi QR Code." };
  }

  if (ctx.activeRole !== Role.TRAINER) {
    return { error: "Silakan aktifkan role TRAINER terlebih dahulu untuk memverifikasi QR Code." };
  }

  if (await isQrVerifyRateLimited(ctx.user.id)) {
    return { error: "Terlalu banyak verifikasi QR. Tunggu sebentar lalu coba lagi." };
  }

  const trainer = await ensureTrainerProfile(ctx.user.id);

  const qrTokenRecord = await prisma.qrToken.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          member: {
            include: {
              subscriptions: {
                where: {
                  status: "ACTIVE",
                  remainingSessions: { gt: 0 },
                },
                orderBy: { endDate: "asc" },
              },
              memberships: {
                where: {
                  status: "ACTIVE",
                  remainingSessions: { gt: 0 },
                },
                orderBy: { endDate: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!qrTokenRecord) {
    return { error: "QR Code tidak valid atau tidak dikenali." };
  }

  if (qrTokenRecord.userId === ctx.user.id) {
    return { error: "Self check-in tidak diizinkan. Trainer tidak dapat memverifikasi QR sendiri." };
  }

  let member = qrTokenRecord.user.member;
  if (!member) {
    member = await prisma.member.create({
      data: { userId: qrTokenRecord.userId },
      include: {
        subscriptions: {
          where: {
            status: "ACTIVE",
            remainingSessions: { gt: 0 },
          },
          orderBy: { endDate: "asc" },
        },
        memberships: {
          where: {
            status: "ACTIVE",
            remainingSessions: { gt: 0 },
          },
          orderBy: { endDate: "asc" },
        },
      },
    });
  }

  if (!canTrainerVerifyMember(trainer, member)) {
    return {
      error: "Member ini terdaftar di bawah trainer lain. Hubungi Admin untuk reassignment.",
    };
  }

  const activeSub = member.subscriptions[0];
  const activeMembership = member.memberships[0];

  if (!activeSub && !activeMembership) {
    return { error: "Member ini tidak memiliki paket aktif atau kuota sesi latihannya telah habis." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const lockedToken = await tx.qrToken.updateMany({
        where: {
          id: qrTokenRecord.id,
          used: false,
          expiresAt: { gt: now },
        },
        data: {
          used: true,
          usedAt: now,
          usedBy: trainer.id,
        },
      });

      if (lockedToken.count === 0) {
        throw new Error("TOKEN_UNAVAILABLE");
      }

      if (!member.trainerId) {
        await tx.member.update({
          where: { id: member.id },
          data: { trainerId: trainer.id },
        });
      }

      let consumedType: "SUBSCRIPTION" | "MEMBERSHIP";
      let consumedId: string;
      let newRemaining = 0;

      if (activeSub) {
        consumedType = "SUBSCRIPTION";
        consumedId = activeSub.id;
        newRemaining = activeSub.remainingSessions - 1;

        await tx.subscription.update({
          where: { id: activeSub.id },
          data: {
            remainingSessions: newRemaining,
            status: newRemaining === 0 ? "EXPIRED" : "ACTIVE",
          },
        });
      } else {
        consumedType = "MEMBERSHIP";
        consumedId = activeMembership.id;
        newRemaining = activeMembership.remainingSessions - 1;

        await tx.membership.update({
          where: { id: activeMembership.id },
          data: {
            remainingSessions: newRemaining,
            status: newRemaining === 0 ? "EXPIRED" : "ACTIVE",
          },
        });
      }

      const attendance = await tx.attendance.create({
        data: {
          memberId: member.id,
          trainerId: trainer.id,
          membershipId: consumedType === "MEMBERSHIP" ? consumedId : null,
          date: now,
          time: now,
          status: "PRESENT",
          checkInType: "QR_SCAN",
          notes: `Check-in via QR Scan. Sisa sesi: ${newRemaining}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: ctx.user.id,
          action: "VERIFY_QR",
          entityType: "ATTENDANCE",
          entityId: attendance.id,
          metadata: {
            memberUserId: qrTokenRecord.userId,
            memberName: qrTokenRecord.user.fullName,
            consumedPackage: consumedType,
            packageId: consumedId,
            remainingSessions: newRemaining,
          },
        },
      });

      return {
        memberName: qrTokenRecord.user.fullName,
        remainingSessions: newRemaining,
        consumedType,
      };
    });

    return {
      success: true,
      message: `Absensi ${result.memberName} berhasil dicatat! Sisa sesi: ${result.remainingSessions}.`,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TOKEN_UNAVAILABLE") {
      return { error: "QR Code sudah digunakan atau kadaluarsa. Minta member me-refresh QR Code." };
    }
    const message = err instanceof Error ? err.message : "Gagal memproses transaksi.";
    return { error: `Gagal memproses transaksi absensi: ${message}` };
  }
}

/**
 * Checks if a QR token has been used. Only the token owner may poll status.
 */
export async function checkQrTokenStatus(token: string) {
  if (!isValidToken(token)) {
    return { error: "Format token tidak valid." };
  }

  const ctx = await requireAuth();

  try {
    const qrRecord = await prisma.qrToken.findUnique({
      where: { token },
      select: { used: true, userId: true },
    });

    if (!qrRecord) {
      return { error: "Token tidak ditemukan." };
    }

    if (qrRecord.userId !== ctx.user.id) {
      return { error: "Anda tidak memiliki akses ke status token ini." };
    }

    return { success: true, used: qrRecord.used };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memeriksa status token.";
    return { error: message };
  }
}
