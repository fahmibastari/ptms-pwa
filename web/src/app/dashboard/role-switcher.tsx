"use client";

import { useTransition, useState } from "react";
import { switchRole } from "@/lib/actions/auth";
import { RefreshCw } from "lucide-react";

interface RoleSwitcherProps {
  availableRoles: string[];
  activeRole: string;
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-400 border-red-500/25",
  TRAINER: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  MEMBER: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

export function RoleSwitcher({ availableRoles, activeRole }: RoleSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRoleChange(newRole: string) {
    if (newRole === activeRole) return;
    setError(null);
    startTransition(async () => {
      const result = await switchRole(newRole);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {availableRoles.map((role) => {
        const isActive = role === activeRole;
        const color = ROLE_COLOR[role] || ROLE_COLOR.MEMBER;
        return (
          <button
            key={role}
            disabled={isPending}
            onClick={() => handleRoleChange(role)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
              isActive
                ? color
                : "bg-transparent text-muted border-white/[0.08] hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {isPending && !isActive && <RefreshCw size={10} className="animate-spin" />}
            {role}
          </button>
        );
      })}
      {error && <span className="text-[10px] text-red-400 ml-1">{error}</span>}
    </div>
  );
}
