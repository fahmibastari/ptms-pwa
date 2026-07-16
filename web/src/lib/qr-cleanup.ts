import { prisma } from "@/lib/prisma";

const PRUNE_AGE_MS = 24 * 60 * 60 * 1000;

export async function pruneExpiredQrTokens(): Promise<number> {
  const cutoff = new Date(Date.now() - PRUNE_AGE_MS);
  const result = await prisma.qrToken.deleteMany({
    where: {
      expiresAt: { lt: cutoff },
    },
  });
  return result.count;
}
