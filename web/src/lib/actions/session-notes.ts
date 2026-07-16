"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Role } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function upsertSessionNote(
  attendanceId: string,
  data: {
    goal: string;
    execution: string;
    feedback: string;
    nextSteps: string;
  }
) {
  const ctx = await requireAuth();

  if (!ctx.availableRoles.includes(Role.TRAINER) || ctx.activeRole !== Role.TRAINER) {
    return { error: "Hanya trainer yang dapat menulis catatan sesi." };
  }

  const trainer = await prisma.trainer.findUnique({
    where: { userId: ctx.user.id },
  });

  if (!trainer) {
    return { error: "Profil trainer tidak ditemukan." };
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { sessionNote: true },
  });

  if (!attendance) {
    return { error: "Sesi tidak ditemukan." };
  }

  if (attendance.trainerId !== trainer.id) {
    return { error: "Anda tidak memiliki akses ke sesi ini." };
  }

  const fields = {
    goal: data.goal.trim(),
    execution: data.execution.trim(),
    feedback: data.feedback.trim(),
    nextSteps: data.nextSteps.trim(),
  };

  if (!fields.goal || !fields.execution || !fields.feedback || !fields.nextSteps) {
    return { error: "Semua field catatan sesi wajib diisi." };
  }

  try {
    const note = attendance.sessionNote
      ? await prisma.trainingSessionNote.update({
          where: { id: attendance.sessionNote.id },
          data: fields,
        })
      : await prisma.trainingSessionNote.create({
          data: {
            attendanceId,
            ...fields,
          },
        });

    await prisma.auditLog.create({
      data: {
        actorId: ctx.user.id,
        action: attendance.sessionNote ? "UPDATE_SESSION_NOTE" : "CREATE_SESSION_NOTE",
        entityType: "SESSION_NOTE",
        entityId: note.id,
        metadata: { attendanceId },
      },
    });

    revalidatePath("/dashboard/sessions");
    return { success: true, note };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan catatan.";
    return { error: message };
  }
}
