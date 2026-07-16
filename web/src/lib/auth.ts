import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";

const VALID_ROLES = new Set<string>(Object.values(Role));

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
};

export type AuthContext = {
  user: AuthUser;
  availableRoles: Role[];
  activeRole: Role;
};

function parseRole(value: unknown): Role | null {
  if (typeof value !== "string" || !VALID_ROLES.has(value)) {
    return null;
  }
  return value as Role;
}

export async function getUserRoles(userId: string): Promise<Role[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true },
  });
  return rows.map((r) => r.role);
}

/**
 * Resolves active role only from roles the user actually has in the database.
 * Client-writable user_metadata cannot grant privileges outside UserRole.
 */
export function resolveActiveRole(
  availableRoles: Role[],
  metadataRole?: unknown
): Role {
  const preferred = parseRole(metadataRole);
  if (preferred && availableRoles.includes(preferred)) {
    return preferred;
  }
  return availableRoles[0] ?? Role.MEMBER;
}

/**
 * cache() deduplicates this call within a single request:
 * middleware, layout, and page all call getAuthContext()
 * but Supabase + Prisma are hit only ONCE per request.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const availableRoles = await getUserRoles(user.id);
  const activeRole = resolveActiveRole(
    availableRoles,
    user.user_metadata?.active_role
  );

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: user.user_metadata?.full_name ?? "User",
    },
    availableRoles,
    activeRole,
  };
});

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}

export async function hasAdminRole(userId: string): Promise<boolean> {
  const row = await prisma.userRole.findUnique({
    where: {
      userId_role: {
        userId,
        role: Role.ADMIN,
      },
    },
  });
  return !!row;
}

export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth();
  const isAdmin = await hasAdminRole(ctx.user.id);
  if (!isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return ctx;
}

export async function requireActiveRole(...roles: Role[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!roles.includes(ctx.activeRole)) {
    throw new Error("FORBIDDEN");
  }
  return ctx;
}

export async function requireDbRole(...roles: Role[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  const hasRole = roles.some((role) => ctx.availableRoles.includes(role));
  if (!hasRole) {
    throw new Error("FORBIDDEN");
  }
  return ctx;
}

export function getWibDayBounds(now = new Date()) {
  const timeZone = "Asia/Jakarta";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(now).split("-").map(Number);
  const startUtc = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
  const endUtc = new Date(Date.UTC(year, month - 1, day, 16, 59, 59, 999));
  return { startUtc, endUtc };
}

export function getWibMonthStart(now = new Date()) {
  const timeZone = "Asia/Jakarta";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month] = formatter.format(now).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1, -7, 0, 0, 0));
}
