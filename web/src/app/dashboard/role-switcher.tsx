"use client";

import { useTransition, useState } from "react";
import { switchRole } from "@/lib/actions/auth";
import { RefreshCw } from "lucide-react";

interface RoleSwitcherProps {
  availableRoles: string[];
  activeRole: string;
}

/* Role chip colors — via semantic tokens (no hardcoded palette) */
const ROLE_COLOR: Record<string, string> = {
  ADMIN:   "bg-role-admin-bg   text-role-admin-text   border-role-admin-border",
  TRAINER: "bg-role-trainer-bg text-role-trainer-text border-role-trainer-border",
  MEMBER:  "bg-role-member-bg  text-role-member-text  border-role-member-border",
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border cursor-pointer disabled:opacity-50 ${
              isActive
                ? color
                : "bg-transparent border-card-border text-muted hover:bg-card hover:text-foreground"
            }`}
            style={{
              /* gate 10: specify transition property */
              transition: "background var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out)",
            }}
          >
            {isPending && !isActive && (
              <RefreshCw size={10} className="animate-spin" />
            )}
            {role}
          </button>
        );
      })}
      {error && (
        <span className="text-[10px] text-error ml-1">{error}</span>
      )}
    </div>
  );
}
