"use client";

import { useState, useEffect, useRef } from "react";
import { generateQrToken, checkQrTokenStatus } from "@/lib/actions/qr";
import QRCode from "qrcode";
import { RefreshCw, QrCode, ShieldAlert, Timer, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function MemberQr() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchToken() {
    if (scannedSuccess) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateQrToken();
      if (res.error) {
        setError(res.error);
        setToken(null);
        setQrUrl(null);
      } else if (res.token) {
        setToken(res.token);
        // Generate standard black-on-white QR code
        const url = await QRCode.toDataURL(res.token, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000", // black
            light: "#ffffff", // white
          },
        });
        setQrUrl(url);
        setTimeLeft(30);
      }
    } catch (err: any) {
      setError("Terjadi kesalahan saat memuat QR Code.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Defer the fetch call to avoid updating the router state during the React mount phase
    const timer = setTimeout(() => {
      fetchToken();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Poll status of the token to see if it is verified
  useEffect(() => {
    if (!token || scannedSuccess) return;

    const pollInterval = setInterval(async () => {
      const res = await checkQrTokenStatus(token);
      if (res.success && res.used) {
        clearInterval(pollInterval);
        setScannedSuccess(true);
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Auto-redirect to dashboard home after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [token, scannedSuccess]);

  // Countdown timer for token regeneration
  useEffect(() => {
    if (!token || scannedSuccess) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [token, scannedSuccess]);

  return (
    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
      {/* QR Container - Pure white container for maximum QR scanning compatibility */}
      <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center p-6 shadow-xl relative overflow-hidden">
        {scannedSuccess ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center animate-scale-up">
            <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
            <p className="text-gray-950 font-bold text-base mt-2">Absensi Berhasil!</p>
            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
              Sisa sesi latihan Anda telah divalidasi oleh Trainer.
            </p>
            <div className="mt-4 flex items-center gap-2 text-gray-500 text-[10px]">
              <RefreshCw size={10} className="animate-spin text-gray-400" />
              <span>Mengalihkan ke Dashboard...</span>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={24} className="text-purple-600 animate-spin" />
            <p className="text-gray-500 text-xs font-medium">Membuat QR Code...</p>
          </div>
        ) : error ? (
          <div className="text-center px-4">
            <ShieldAlert size={28} className="text-red-500 mx-auto mb-3" />
            <p className="text-xs text-gray-700 font-medium leading-relaxed">{error}</p>
            <button
              onClick={fetchToken}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 text-xs text-gray-800 transition-colors cursor-pointer font-medium"
            >
              Coba Lagi
            </button>
          </div>
        ) : qrUrl ? (
          <img
            src={qrUrl}
            alt="Attendance QR Code"
            className="w-full h-full object-contain select-none animate-fade-in"
          />
        ) : (
          <div className="text-center text-gray-400 text-xs">
            <QrCode size={28} className="mx-auto mb-2 opacity-40" />
            Belum ada QR Code
          </div>
        )}
      </div>

      {/* Countdown Timer */}
      {token && !loading && !scannedSuccess && (
        <div className="mt-6 flex flex-col items-center gap-2 w-full">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
            <Timer size={14} className="text-accent" />
            <span>Kadaluarsa Dalam</span>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[200px]">
            {/* Visual Progress bar */}
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
            <span className="text-sm font-mono font-bold text-white w-6 text-right">
              {timeLeft}s
            </span>
          </div>

          <button
            onClick={fetchToken}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={11} />
            Perbarui Manual
          </button>
        </div>
      )}
    </div>
  );
}
