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

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-400 border-red-500/25",
  TRAINER: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  MEMBER: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
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
    icon: <LayoutDashboard size={18} />,
    roles: ["ADMIN", "TRAINER", "MEMBER"],
  },
  {
    label: "Manajemen User",
    href: "/dashboard/users",
    icon: <Users size={18} />,
    roles: ["ADMIN"],
  },
  {
    label: "QR Absensi",
    href: "/dashboard/attendance",
    icon: <QrCode size={18} />,
    roles: ["MEMBER", "TRAINER"],
  },
  {
    label: "Sesi Latihan",
    href: "/dashboard/sessions",
    icon: <Dumbbell size={18} />,
    roles: ["TRAINER", "MEMBER"],
  },
  {
    label: "Audit Log",
    href: "/dashboard/logs",
    icon: <ClipboardList size={18} />,
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

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#0c0c14]/90 border border-white/[0.08] text-muted hover:text-white transition-colors cursor-pointer"
      >
        <Menu size={20} />
      </button>

      {/* Overlay (mobile only) */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col w-[260px] border-r border-white/[0.06] bg-[#0c0c14] transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
              <Shield size={16} className="text-accent" />
            </div>
            <span className="font-bold text-sm tracking-tight">PTMS Dev</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md hover:bg-white/5 text-muted transition-colors cursor-pointer lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className="border-t border-white/[0.06] px-3 py-4 shrink-0">
          <div className="px-3 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                ROLE_COLOR[activeRole] || ROLE_COLOR.MEMBER
              }`}
            >
              {activeRole}
            </span>
          </div>

          <div className="px-3 mb-3">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-[11px] text-muted truncate mt-0.5">{userEmail}</p>
          </div>

          <button
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut size={18} />
            <span>{isPending ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
