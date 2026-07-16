"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/password";
import Link from "next/link";
import { Shield, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ overflow: "hidden" }}>

      {/* Left — branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{ background: "var(--accent)" }}
      >
        <div className="flex items-center gap-2.5">
          <Shield size={20} style={{ color: "var(--accent-ink)" }} />
          <span className="text-sm font-semibold tracking-wide" style={{ color: "var(--accent-ink)" }}>
            PTMS Dev
          </span>
        </div>
        <div>
          <h2
            className="text-3xl font-bold leading-snug"
            style={{ color: "var(--accent-ink)", fontStyle: "normal" }}
          >
            Lupa password?<br />Kami bantu reset.
          </h2>
          <p
            className="mt-4 text-sm leading-relaxed max-w-xs"
            style={{ color: "var(--accent-ink)", opacity: 0.78 }}
          >
            Masukkan email terdaftar dan kami akan mengirimkan link untuk mengatur ulang password Anda.
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--accent-ink)", opacity: 0.45 }}>
          Personal Trainer Management System
        </p>
      </div>

      {/* Right — form panel */}
      <div
        className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16"
        style={{ background: "var(--background)" }}
      >
        {/* Mobile wordmark */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Shield size={16} style={{ color: "var(--accent-ink)" }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>PTMS Dev</span>
        </div>

        <div className="max-w-sm w-full animate-fade-in">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontStyle: "normal" }}>
              Reset password
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--muted)" }}>
              Masukkan email terdaftar untuk menerima link reset.
            </p>
          </div>

          {state?.error && (
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3 mb-6 animate-fade-in"
              style={{ background: "var(--error-surface)", border: "1px solid var(--error-border)" }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--error)" }} />
              <p className="text-sm" style={{ color: "var(--error)" }}>{state.error}</p>
            </div>
          )}

          {state?.success && (
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3 mb-6 animate-fade-in"
              style={{ background: "oklch(97% 0.01 155)", border: "1px solid oklch(80% 0.1 155)" }}
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
              <p className="text-sm" style={{ color: "var(--success)" }}>{state.success}</p>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>
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

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary mt-2 flex items-center justify-center gap-2 w-full"
            >
              {isPending ? <span className="spinner" /> : "Kirim Link Reset"}
            </button>
          </form>

          <p className="text-center text-sm mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-medium transition-colors"
              style={{ color: "var(--accent)" }}
            >
              <ArrowLeft size={14} />
              Kembali ke Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
