"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import Link from "next/link";
import { Shield, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    /* Split layout: left branding (desktop) + right form */
    <div className="min-h-screen grid lg:grid-cols-2" style={{ overflow: "hidden" }}>

      {/* ── Left — branding panel (desktop only) ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{ background: "var(--accent)" }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          <Shield size={20} style={{ color: "var(--accent-ink)" }} />
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: "var(--accent-ink)" }}
          >
            PTMS Dev
          </span>
        </div>

        {/* Tagline */}
        <div>
          <h2
            className="text-3xl font-bold leading-snug"
            style={{ color: "var(--accent-ink)", fontStyle: "normal" }}
          >
            Kelola sesi latihan<br />dengan lebih mudah
          </h2>
          <p
            className="mt-4 text-sm leading-relaxed max-w-xs"
            style={{ color: "var(--accent-ink)", opacity: 0.78 }}
          >
            Absensi QR, jadwal trainer, laporan kehadiran — semua dalam
            satu platform untuk gym Anda.
          </p>
        </div>

        {/* Footer credit */}
        <p
          className="text-xs"
          style={{ color: "var(--accent-ink)", opacity: 0.45 }}
        >
          Personal Trainer Management System
        </p>
      </div>

      {/* ── Right — form panel ── */}
      <div
        className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16"
        style={{ background: "var(--background)" }}
      >
        {/* Mobile wordmark */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <Shield size={16} style={{ color: "var(--accent-ink)" }} />
          </div>
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--foreground)" }}
          >
            PTMS Dev
          </span>
        </div>

        <div className="max-w-sm w-full animate-fade-in">
          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--foreground)", fontStyle: "normal" }}
            >
              Masuk ke akun Anda
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--muted)" }}>
              Gunakan email dan password yang terdaftar.
            </p>
          </div>

          {/* Error alert */}
          {state?.error && (
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3 mb-6 animate-fade-in"
              style={{
                background: "var(--error-surface)",
                border: "1px solid var(--error-border)",
              }}
            >
              <AlertCircle
                size={16}
                className="shrink-0 mt-0.5"
                style={{ color: "var(--error)" }}
              />
              <p className="text-sm" style={{ color: "var(--error)" }}>
                {state.error}
              </p>
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--muted)" }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                className="auth-input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  Lupa password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password"
                required
                className="auth-input"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary mt-2 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="spinner" />
              ) : (
                <>
                  Masuk
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p
            className="text-center text-sm mt-8"
            style={{ color: "var(--muted)" }}
          >
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium transition-colors"
              style={{ color: "var(--accent)" }}
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
