"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Role } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  try {
    return { ctx: await requireAdmin(), error: null };
  } catch {
    return { ctx: null, error: "Hanya Admin yang memiliki otorisasi untuk aksi ini." };
  }
}

export async function getTrainerAssignments() {
  const { error } = await assertAdmin();
  if (error) return { error };

  try {
    const trainers = await prisma.trainer.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const members = await prisma.member.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            roles: true,
          },
        },
        trainer: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const memberUsers = members.filter((m) =>
      m.user.roles.some((r) => r.role === Role.MEMBER)
    );

    return {
      success: true,
      trainers: trainers.map((t) => ({
        id: t.id,
        userId: t.userId,
        fullName: t.user.fullName,
        email: t.user.email,
        memberCount: t.members.length,
        members: t.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          fullName: m.user.fullName,
          email: m.user.email,
        })),
      })),
      allMembers: memberUsers.map((m) => ({
        id: m.id,
        userId: m.userId,
        fullName: m.user.fullName,
        email: m.user.email,
        trainerId: m.trainerId,
        trainerName: m.trainer?.user.fullName ?? null,
      })),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat data assignment.";
    return { error: message };
  }
}

export async function assignMemberToTrainer(
  memberUserId: string,
  trainerUserId: string | null
) {
  const { ctx, error } = await assertAdmin();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  try {
    const memberRole = await prisma.userRole.findUnique({
      where: {
        userId_role: {
          userId: memberUserId,
          role: Role.MEMBER,
        },
      },
    });

    if (!memberRole) {
      return { error: "User yang dipilih bukan member." };
    }

    let member = await prisma.member.findUnique({
      where: { userId: memberUserId },
    });

    if (!member) {
      member = await prisma.member.create({
        data: { userId: memberUserId },
      });
    }

    if (!trainerUserId) {
      const previousTrainerId = member.trainerId;

      await prisma.member.update({
        where: { id: member.id },
        data: { trainerId: null },
      });

      if (previousTrainerId) {
        const prevTrainer = await prisma.trainer.findUnique({
          where: { id: previousTrainerId },
        });
        if (prevTrainer) {
          await prisma.trainer.update({
            where: { id: previousTrainerId },
            data: {
              assignedMemberIds: prevTrainer.assignedMemberIds.filter(
                (id) => id !== member!.id
              ),
            },
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          actorId: ctx.user.id,
          action: "UNASSIGN_TRAINER",
          entityType: "MEMBER",
          entityId: member.id,
          metadata: { memberUserId },
        },
      });

      revalidatePath("/dashboard/users");
      return { success: true };
    }

    const trainer = await prisma.trainer.findUnique({
      where: { userId: trainerUserId },
    });

    if (!trainer) {
      return { error: "Trainer tidak ditemukan." };
    }

    const trainerRole = await prisma.userRole.findUnique({
      where: {
        userId_role: {
          userId: trainerUserId,
          role: Role.TRAINER,
        },
      },
    });

    if (!trainerRole) {
      return { error: "User yang dipilih bukan trainer." };
    }

    if (memberUserId === trainerUserId) {
      return { error: "Member dan trainer tidak boleh akun yang sama." };
    }

    const previousTrainerId = member.trainerId;

    await prisma.$transaction(async (tx) => {
      if (previousTrainerId && previousTrainerId !== trainer.id) {
        const prevTrainer = await tx.trainer.findUnique({
          where: { id: previousTrainerId },
        });
        if (prevTrainer) {
          await tx.trainer.update({
            where: { id: previousTrainerId },
            data: {
              assignedMemberIds: prevTrainer.assignedMemberIds.filter(
                (id) => id !== member!.id
              ),
            },
          });
        }
      }

      await tx.member.update({
        where: { id: member!.id },
        data: { trainerId: trainer.id },
      });

      const assignedIds = trainer.assignedMemberIds.includes(member!.id)
        ? trainer.assignedMemberIds
        : [...trainer.assignedMemberIds, member!.id];

      await tx.trainer.update({
        where: { id: trainer.id },
        data: { assignedMemberIds: assignedIds },
      });

      await tx.auditLog.create({
        data: {
          actorId: ctx.user.id,
          action: "ASSIGN_TRAINER",
          entityType: "MEMBER",
          entityId: member!.id,
          metadata: {
            memberUserId,
            trainerUserId,
            trainerId: trainer.id,
          },
        },
      });
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengassign trainer.";
    return { error: message };
  }
}
