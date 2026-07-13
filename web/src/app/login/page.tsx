"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import Link from "next/link";
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

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
          <h1 className="text-2xl font-bold tracking-tight">Masuk ke PTMS</h1>
          <p className="text-muted text-sm mt-2">
            Personal Trainer Management System
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
                placeholder="Masukkan password"
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
                Masuk
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          Belum punya akun?{" "}
          <Link href="/register" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
