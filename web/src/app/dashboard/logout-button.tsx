"use client";

import { useTransition } from "react";
import { logout } from "@/lib/actions/auth";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="px-4 py-2 text-sm font-semibold rounded-lg bg-error/10 hover:bg-error/20 text-error border border-error/20 transition-all cursor-pointer disabled:opacity-50"
    >
      {isPending ? "Keluar..." : "Keluar"}
    </button>
  );
}
