"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

async function assertAdmin() {
  try {
    const ctx = await requireAdmin();
    return { ctx, error: null };
  } catch {
    return { ctx: null, error: "Hanya Admin yang memiliki otorisasi untuk aksi ini." };
  }
}

// ─────────────────────────────────────────────
// 1. Package Actions
// ─────────────────────────────────────────────

export async function getPackages() {
  const { error } = await assertAdmin();
  if (error) return { error };

  try {
    const rows = await prisma.package.findMany({
      orderBy: { createdAt: "desc" },
    });
    // Prisma Decimal can't be serialized to Client Components — convert to number
    const packages = rows.map((p) => ({ ...p, price: p.price.toNumber() }));
    return { success: true, packages };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat paket.";
    return { error: message };
  }
}

export async function createPackage(data: {
  name: string;
  price: number;
  sessions: number;
  durationMonths: number;
}) {
  const { ctx, error } = await assertAdmin();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  if (!data.name?.trim()) return { error: "Nama paket wajib diisi." };
  if (data.price < 0 || data.sessions < 1 || data.durationMonths < 1) {
    return { error: "Harga, sesi, dan durasi harus valid." };
  }

  try {
    const newPackage = await prisma.package.create({
      data: {
        name: data.name.trim(),
        price: data.price,
        sessions: data.sessions,
        durationMonths: data.durationMonths,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: ctx.user.id,
        action: "CREATE_PACKAGE",
        entityType: "PACKAGE",
        entityId: String(newPackage.id),
        metadata: { name: newPackage.name, price: data.price, sessions: data.sessions },
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true, package: { ...newPackage, price: newPackage.price.toNumber() } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat paket.";
    return { error: message };
  }
}

export async function updatePackage(
  id: number,
  data: { name?: string; price?: number; sessions?: number; durationMonths?: number }
) {
  const { ctx, error } = await assertAdmin();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  if (data.name !== undefined && !data.name.trim()) return { error: "Nama paket tidak boleh kosong." };
  if (data.price !== undefined && data.price < 0) return { error: "Harga tidak valid." };
  if (data.sessions !== undefined && data.sessions < 1) return { error: "Jumlah sesi minimal 1." };
  if (data.durationMonths !== undefined && data.durationMonths < 1) return { error: "Durasi minimal 1 bulan." };

  try {
    const updated = await prisma.package.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.sessions !== undefined && { sessions: data.sessions }),
        ...(data.durationMonths !== undefined && { durationMonths: data.durationMonths }),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: ctx.user.id,
        action: "UPDATE_PACKAGE",
        entityType: "PACKAGE",
        entityId: String(id),
        metadata: { changes: data },
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true, package: { ...updated, price: updated.price.toNumber() } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengupdate paket.";
    return { error: message };
  }
}

export async function deletePackage(id: number) {
  const { ctx, error } = await assertAdmin();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  try {
    const pkg = await prisma.package.findUnique({ where: { id } });
    if (!pkg) return { error: "Paket tidak ditemukan." };

    await prisma.package.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: ctx.user.id,
        action: "DELETE_PACKAGE",
        entityType: "PACKAGE",
        entityId: String(id),
        metadata: { name: pkg.name },
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus paket. Paket mungkin sedang digunakan oleh pelanggan." };
  }
}

// ─────────────────────────────────────────────
// 2. Member & Subscription Actions
// ─────────────────────────────────────────────

export async function getMembersWithSubscriptions() {
  const { error } = await assertAdmin();
  if (error) return { error };

  try {
    const members = await prisma.member.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        subscriptions: {
          include: { package: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedMembers = members.map((m) => ({
      id: m.id,
      userId: m.userId,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat data member.";
    return { error: message };
  }
}

export async function createMemberSubscription(userId: string, packageId: number) {
  const { ctx, error } = await assertAdmin();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  try {
    let member = await prisma.member.findUnique({ where: { userId } });
    if (!member) {
      member = await prisma.member.create({ data: { userId } });
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return { error: "Paket tidak ditemukan." };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + pkg.durationMonths);

    await prisma.subscription.updateMany({
      where: { memberId: member.id, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });

    const newSub = await prisma.subscription.create({
      data: {
        memberId: member.id,
        packageId,
        startDate,
        endDate,
        status: "ACTIVE",
        remainingSessions: pkg.sessions,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: ctx.user.id,
        action: "CREATE_SUBSCRIPTION",
        entityType: "SUBSCRIPTION",
        entityId: newSub.id,
        metadata: { memberId: member.id, packageId, packageName: pkg.name },
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true, subscription: newSub };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengaktifkan langganan.";
    return { error: message };
  }
}

export async function cancelSubscription(subscriptionId: string) {
  const { ctx, error } = await assertAdmin();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { package: { select: { name: true } }, member: { select: { userId: true } } },
    });

    if (!sub) return { error: "Langganan tidak ditemukan." };
    if (sub.status !== "ACTIVE") return { error: "Hanya langganan aktif yang bisa dibatalkan." };

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });

    await prisma.auditLog.create({
      data: {
        actorId: ctx.user.id,
        action: "CANCEL_SUBSCRIPTION",
        entityType: "SUBSCRIPTION",
        entityId: subscriptionId,
        metadata: {
          memberUserId: sub.member.userId,
          packageName: sub.package.name,
          remainingSessions: sub.remainingSessions,
        },
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membatalkan langganan.";
    return { error: message };
  }
}

export async function updateSubscriptionSessions(
  subscriptionId: string,
  remainingSessions: number
) {
  const { ctx, error } = await assertAdmin();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  if (remainingSessions < 0) return { error: "Sisa sesi tidak boleh kurang dari 0." };

  try {
    const updatedSub = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        remainingSessions,
        status: remainingSessions === 0 ? "EXPIRED" : "ACTIVE",
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true, subscription: updatedSub };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui kuota sesi.";
    return { error: message };
  }
}
