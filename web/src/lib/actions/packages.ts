"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Package Actions
export async function getPackages() {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, packages };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createPackage(data: {
  name: string;
  price: number;
  sessions: number;
  durationMonths: number;
}) {
  try {
    const newPackage = await prisma.package.create({
      data: {
        name: data.name,
        price: data.price,
        sessions: data.sessions,
        durationMonths: data.durationMonths,
        isActive: true,
      },
    });
    revalidatePath("/dashboard/users");
    return { success: true, package: newPackage };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deletePackage(id: number) {
  try {
    await prisma.package.delete({
      where: { id },
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err: any) {
    return { error: "Gagal menghapus paket. Paket mungkin sedang digunakan oleh pelanggan." };
  }
}

// 2. Member & Subscription Actions
export async function getMembersWithSubscriptions() {
  try {
    const members = await prisma.member.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        subscriptions: {
          include: {
            package: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedMembers = members.map((m) => ({
      id: m.id,
      fullName: m.user.fullName || "Unnamed Member",
      email: m.user.email,
      subscriptions: m.subscriptions.map((s) => ({
        id: s.id,
        packageName: s.package.name,
        packageId: s.packageId,
        sessions: s.package.sessions,
        remainingSessions: s.remainingSessions,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
      })),
    }));

    return { success: true, members: formattedMembers };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createMemberSubscription(memberId: string, packageId: number) {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!pkg) {
      return { error: "Paket tidak ditemukan." };
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + pkg.durationMonths);

    // Deactivate previous active subscriptions for this member
    await prisma.subscription.updateMany({
      where: {
        memberId,
        status: "ACTIVE",
      },
      data: {
        status: "EXPIRED",
      },
    });

    const newSub = await prisma.subscription.create({
      data: {
        memberId,
        packageId,
        startDate,
        endDate,
        status: "ACTIVE",
        remainingSessions: pkg.sessions,
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true, subscription: newSub };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateSubscriptionSessions(subscriptionId: string, remainingSessions: number) {
  try {
    if (remainingSessions < 0) {
      return { error: "Sisa sesi tidak boleh kurang dari 0." };
    }

    const updatedSub = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        remainingSessions,
        status: remainingSessions === 0 ? "EXPIRED" : "ACTIVE",
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true, subscription: updatedSub };
  } catch (err: any) {
    return { error: err.message };
  }
}
