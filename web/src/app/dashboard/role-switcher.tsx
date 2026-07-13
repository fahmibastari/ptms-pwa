"use client";

import { useTransition, useState } from "react";
import { switchRole } from "@/lib/actions/auth";

interface RoleSwitcherProps {
  availableRoles: string[];
  activeRole: string;
}

export function RoleSwitcher({ availableRoles, activeRole }: RoleSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(newRole: string) {
    if (newRole === activeRole) return;
    setError(null);
    startTransition(async () => {
      const result = await switchRole(newRole);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="glass-card px-7 py-6">
      <p className="text-muted text-[11px] uppercase tracking-widest font-medium mb-2">Active Role</p>

      {availableRoles.length <= 1 ? (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
          {activeRole}
        </span>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => {
              const isActive = role === activeRole;
              return (
                <button
                  key={role}
                  disabled={isPending}
                  onClick={() => handleRoleChange(role)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-accent text-white shadow-md shadow-accent/20"
                      : "bg-white/5 hover:bg-white/10 text-foreground border border-card-border"
                  } disabled:opacity-50`}
                >
                  {role}
                </button>
              );
            })}
          </div>
          {isPending && <p className="text-xs text-muted animate-pulse">Switching role...</p>}
          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
