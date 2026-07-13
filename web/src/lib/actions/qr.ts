"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generates a secure, short-lived QR token for the authenticated member.
 */
export async function generateQrToken() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Silakan login terlebih dahulu." };
  }

  // 1. Verify user role
  const dbRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    select: { role: true },
  });
  const availableRoles = dbRoles.map((r) => r.role);
  const activeRole = user.user_metadata?.active_role || availableRoles[0] || "MEMBER";

  if (activeRole !== "MEMBER") {
    return { error: "Hanya akun dengan role MEMBER yang dapat menghasilkan QR Code." };
  }

  // 2. Fetch member profile
  let member = await prisma.member.findUnique({
    where: { userId: user.id },
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
    // Lazy initialize Member profile if it does not exist
    member = await prisma.member.create({
      data: {
        userId: user.id,
      },
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

  // 3. Verify if member has remaining sessions in Subscription or Membership
  let hasActiveSubscription = member.subscriptions.length > 0;
  let hasActiveMembership = member.memberships.length > 0;

  if (!hasActiveSubscription && !hasActiveMembership) {
    try {
      // Auto-provision a default trial package for testing if none exists
      let defaultPackage = await prisma.package.findFirst();
      if (!defaultPackage) {
        defaultPackage = await prisma.package.create({
          data: {
            name: "Trial 10 Sesi (Auto-provisioned)",
            price: 0,
            sessions: 10,
            durationMonths: 1,
            isActive: true,
          },
        });
      }

      const newSub = await prisma.subscription.create({
        data: {
          memberId: member.id,
          packageId: defaultPackage.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: "ACTIVE",
          remainingSessions: 10,
        },
      });

      member.subscriptions.push(newSub);
      hasActiveSubscription = true;
    } catch (err) {
      return {
        error: "Anda tidak memiliki paket aktif, dan pembuatan paket uji coba gagal. Silakan hubungi Admin.",
      };
    }
  }

  // 4. Generate 256-bit cryptographically secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 1000); // Expires in 30 seconds

  try {
    const qrRecord = await prisma.qrToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      success: true,
      token: qrRecord.token,
      expiresAt: qrRecord.expiresAt.toISOString(),
    };
  } catch (err: any) {
    return { error: `Gagal membuat QR token: ${err.message}` };
  }
}

/**
 * Verifies a scanned QR token, records attendance, and reduces session count in a single transaction.
 */
export async function verifyQrToken(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Silakan login terlebih dahulu." };
  }

  // 1. Verify verifier role (Must be TRAINER)
  const dbRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    select: { role: true },
  });
  const availableRoles = dbRoles.map((r) => r.role);
  const activeRole = user.user_metadata?.active_role || availableRoles[0] || "MEMBER";

  if (activeRole !== "TRAINER") {
    return { error: "Hanya akun dengan role TRAINER yang dapat melakukan verifikasi QR Code." };
  }

  // Fetch Trainer profile
  let trainer = await prisma.trainer.findUnique({
    where: { userId: user.id },
  });

  if (!trainer) {
    trainer = await prisma.trainer.create({
      data: {
        userId: user.id,
      },
    });
  }

  // 2. Fetch the QrToken
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

  if (qrTokenRecord.used) {
    return { error: "QR Code ini sudah pernah digunakan sebelumnya." };
  }

  if (new Date() > qrTokenRecord.expiresAt) {
    return { error: "QR Code sudah kadaluarsa. Silakan minta member me-refresh QR Code." };
  }

  let member = qrTokenRecord.user.member;
  if (!member) {
    member = await prisma.member.create({
      data: {
        userId: qrTokenRecord.userId,
      },
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

  // 3. Determine package/session to deduct (Subscription or Membership)
  const activeSub = member.subscriptions[0];
  const activeMembership = member.memberships[0];

  if (!activeSub && !activeMembership) {
    return { error: "Member ini tidak memiliki paket aktif atau kuota sesi latihannya telah habis." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // a. Mark token as used
      await tx.qrToken.update({
        where: { id: qrTokenRecord.id },
        data: {
          used: true,
          usedAt: new Date(),
          usedBy: trainer.id,
        },
      });

      // b. Deduct 1 session from oldest active package
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

      // c. Insert Attendance record
      const attendance = await tx.attendance.create({
        data: {
          memberId: member.id,
          trainerId: trainer.id,
          membershipId: consumedType === "MEMBERSHIP" ? consumedId : null,
          date: new Date(),
          time: new Date(),
          status: "PRESENT",
          checkInType: "QR_SCAN",
          notes: `Check-in via QR Scan. Sisa sesi: ${newRemaining}`,
        },
      });

      // d. Create Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
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
  } catch (err: any) {
    return { error: `Gagal memproses transaksi absensi: ${err.message}` };
  }
}

/**
 * Checks if a QR token has been used.
 */
export async function checkQrTokenStatus(token: string) {
  try {
    const qrRecord = await prisma.qrToken.findUnique({
      where: { token },
      select: { used: true },
    });
    return { success: true, used: !!qrRecord?.used };
  } catch (err: any) {
    return { error: err.message };
  }
}

