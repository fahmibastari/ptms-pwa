"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import { logout } from "@/lib/actions/auth";
import {
  LayoutDashboard,
  Users,
  QrCode,
  Dumbbell,
  ClipboardList,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  activeRole: string;
  userName: string;
  userEmail: string;
}

const ROLE_CHIP: Record<string, string> = {
  ADMIN:   "bg-role-admin-bg   text-role-admin-text   border-role-admin-border",
  TRAINER: "bg-role-trainer-bg text-role-trainer-text border-role-trainer-border",
  MEMBER:  "bg-role-member-bg  text-role-member-text  border-role-member-border",
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: <LayoutDashboard size={17} />,
    roles: ["ADMIN", "TRAINER", "MEMBER"],
  },
  {
    label: "Manajemen User",
    href: "/dashboard/users",
    icon: <Users size={17} />,
    roles: ["ADMIN"],
  },
  {
    label: "QR Absensi",
    href: "/dashboard/attendance",
    icon: <QrCode size={17} />,
    roles: ["MEMBER", "TRAINER"],
  },
  {
    label: "Sesi Latihan",
    href: "/dashboard/sessions",
    icon: <Dumbbell size={17} />,
    roles: ["TRAINER", "MEMBER"],
  },
  {
    label: "Audit Log",
    href: "/dashboard/logs",
    icon: <ClipboardList size={17} />,
    roles: ["ADMIN"],
  },
];

export function Sidebar({ activeRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(activeRole)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile toggle — hardcoded z:370 beats header(300), overlay(340), sidebar(360) */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed top-3 left-3 lg:hidden p-2.5 rounded-xl cursor-pointer"
        style={{
          zIndex: 370,
          background: "var(--accent)",
          color: "var(--accent-ink)",
          boxShadow: "0 2px 8px oklch(52% 0.24 264 / 0.35)",
        }}
        aria-label={open ? "Tutup menu" : "Buka menu"}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 lg:hidden"
          style={{ zIndex: 340, background: "oklch(22% 0.02 264 / 0.45)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel — z-sidebar (360) above header (300) and overlay (340) */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen flex flex-col w-[260px] ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{
          zIndex: 360,
          background: "var(--background)",
          borderRight: "1px solid var(--card-border)",
          transition: "transform var(--dur-medium) var(--ease-out)",
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center justify-between px-5 h-16 shrink-0"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <Shield size={15} style={{ color: "var(--accent-ink)" }} />
            </div>
            <span
              className="font-bold text-sm tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              PTMS Dev
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md cursor-pointer lg:hidden"
            style={{ color: "var(--muted)" }}
            aria-label="Tutup menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div className="space-y-0.5">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium"
                  style={{
                    background: isActive ? "var(--accent)" : "transparent",
                    color: isActive ? "var(--accent-ink)" : "var(--muted)",
                    transition: "background var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out)",
                  }}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User footer */}
        <div
          className="px-3 py-4 shrink-0"
          style={{ borderTop: "1px solid var(--card-border)" }}
        >
          <div className="px-3 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                ROLE_CHIP[activeRole] || ROLE_CHIP.MEMBER
              }`}
            >
              {activeRole}
            </span>
          </div>

          <div className="px-3 mb-3">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--foreground)" }}
            >
              {userName}
            </p>
            <p
              className="text-[11px] truncate mt-0.5"
              style={{ color: "var(--muted)" }}
            >
              {userEmail}
            </p>
          </div>

          <button
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-50"
            style={{
              color: "var(--muted)",
              transition: "color var(--dur-short) var(--ease-out), background var(--dur-short) var(--ease-out)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "oklch(98% 0.01 25)";
              (e.currentTarget as HTMLElement).style.color = "var(--error)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--muted)";
            }}
          >
            <LogOut size={17} />
            <span>{isPending ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
