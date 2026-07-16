import { NextResponse } from "next/server";
import { pruneExpiredQrTokens } from "@/lib/qr-cleanup";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await pruneExpiredQrTokens();
  return NextResponse.json({ success: true, deleted });
}
