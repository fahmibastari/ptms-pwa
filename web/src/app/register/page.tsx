"use client";

import { useActionState } from "react";
import { register } from "@/lib/actions/auth";
import Link from "next/link";
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="relative z-10 w-full max-w-[400px] animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto mb-5">
            <Shield size={22} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Akun PTMS</h1>
          <p className="text-muted text-sm mt-2">
            Daftar untuk mulai menggunakan sistem
          </p>
        </div>

        {/* Error */}
        {state?.error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-4 py-3 mb-6 animate-fade-in">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{state.error}</p>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-muted mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/50" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Nama lengkap Anda"
                required
                className="auth-input pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-muted mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/50" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                className="auth-input pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/50" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Minimal 8 karakter"
                required
                className="auth-input pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-muted mb-1.5">
              Konfirmasi Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/50" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                required
                className="auth-input pl-10"
              />
            </div>
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
                Daftar
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
