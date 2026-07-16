"use client";

import { useTransition } from "react";
import { logout } from "@/lib/actions/auth";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="px-4 py-2 text-sm font-semibold rounded-lg bg-error-surface hover:bg-error/10 text-error border border-error-border cursor-pointer disabled:opacity-50"
      style={{ transition: "background-color var(--dur-short) var(--ease-out)" }}
    >
      {isPending ? "Keluar..." : "Keluar"}
    </button>
  );
}
