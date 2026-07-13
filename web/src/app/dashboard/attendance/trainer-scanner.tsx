"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { verifyQrToken } from "@/lib/actions/qr";
import { Html5Qrcode } from "html5-qrcode";
import {
  CheckCircle2,
  AlertTriangle,
  Scan,
  ArrowRight,
  RefreshCw,
  Camera,
  Keyboard,
  CameraOff,
} from "lucide-react";

export function TrainerScanner() {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [token, setToken] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const startPromiseRef = useRef<Promise<any> | null>(null);

  // Stop camera scanning
  const stopScanner = async () => {
    if (qrCodeInstanceRef.current) {
      if (startPromiseRef.current) {
        try {
          await startPromiseRef.current;
        } catch (e) {
          // ignore start promise errors
        }
        startPromiseRef.current = null;
      }

      if (qrCodeInstanceRef.current.isScanning) {
        try {
          await qrCodeInstanceRef.current.stop();
        } catch (err) {
          // ignore stop errors
        }
      }
    }
    setCameraActive(false);
  };

  // Start camera scanning
  const startScanner = async () => {
    setCameraError(null);
    setResult(null);

    // Browser Security: mediaDevices / camera access is only allowed on localhost or HTTPS
    const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const isInsecure = typeof window !== "undefined" && window.location.protocol === "http:" && !isLocalhost;

    if (isInsecure) {
      setCameraError(
        "Browser memblokir kamera pada koneksi HTTP biasa. Silakan akses dashboard menggunakan HTTPS (seperti menggunakan Ngrok) untuk menguji kamera di handphone."
      );
      setCameraActive(false);
      return;
    }

    // Give a brief delay to ensure the container is mounted
    setTimeout(async () => {
      try {
        const element = document.getElementById("reader");
        if (!element) return;

        const html5QrCode = new Html5Qrcode("reader");
        qrCodeInstanceRef.current = html5QrCode;

        const promise = html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Trigger check-in on successful scan
            handleVerification(decodedText);
          },
          () => {
            // Silence silent scan failures (normal behavior when scanning frames)
          }
        );

        startPromiseRef.current = promise;
        await promise;

        setCameraActive(true);
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setCameraError(
          "Gagal mengakses kamera. Pastikan izin kamera telah diberikan."
        );
        setCameraActive(false);
      }
    }, 100);
  };

  const handleVerification = (scannedToken: string) => {
    // Stop camera immediately to prevent multiple scans
    stopScanner();

    setResult(null);
    startTransition(async () => {
      const res = await verifyQrToken(scannedToken.trim());
      if (res.error) {
        setResult({ error: res.error });
      } else {
        setResult({ success: true, message: res.message });
      }
    });
  };

  // Handle manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    handleVerification(token);
    setToken("");
  };

  // Restart camera after showing results
  const handleReset = () => {
    setResult(null);
    if (activeTab === "camera") {
      startScanner();
    }
  };

  // Start/Stop scanner based on active tab and results
  useEffect(() => {
    if (activeTab === "camera" && !result) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [activeTab, result]);

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Navigation tabs */}
      <div className="flex rounded-lg bg-white/[0.03] p-1 border border-white/[0.06]">
        <button
          onClick={() => {
            setActiveTab("camera");
            setResult(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "camera"
              ? "bg-accent text-white shadow-md"
              : "text-muted hover:text-white"
          }`}
        >
          <Camera size={14} />
          Kamera Scanner
        </button>
        <button
          onClick={() => {
            setActiveTab("manual");
            setResult(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "manual"
              ? "bg-accent text-white shadow-md"
              : "text-muted hover:text-white"
          }`}
        >
          <Keyboard size={14} />
          Input Manual
        </button>
      </div>

      {/* Main scanning screen */}
      <div className="glass-card aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden p-0">
        {isPending ? (
          <div className="flex flex-col items-center gap-3 p-6">
            <RefreshCw size={24} className="text-accent animate-spin" />
            <p className="text-muted text-xs">Memverifikasi token absensi...</p>
          </div>
        ) : result?.success ? (
          <div className="text-center p-6 animate-scale-up">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">Verifikasi Sukses</h4>
            <p className="text-xs text-muted mt-2 leading-relaxed max-w-xs mx-auto">
              {result.message}
            </p>
            <button
              onClick={handleReset}
              className="mt-5 px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors cursor-pointer font-semibold"
            >
              Scan Kembali
            </button>
          </div>
        ) : result?.error ? (
          <div className="text-center p-6 animate-scale-up">
            <AlertTriangle size={36} className="text-red-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">Verifikasi Gagal</h4>
            <p className="text-xs text-red-300 mt-2 leading-relaxed max-w-xs mx-auto">
              {result.error}
            </p>
            <button
              onClick={handleReset}
              className="mt-5 px-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white text-xs transition-colors cursor-pointer font-semibold"
            >
              Coba Lagi
            </button>
          </div>
        ) : activeTab === "camera" ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            {/* HTML5 QrCode camera view container */}
            <div id="reader" className="w-full h-full object-cover"></div>

            {/* Corner overlay scanner effect */}
            {cameraActive && (
              <>
                <div className="absolute inset-0 border-[24px] border-black/40 pointer-events-none" />
                <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-accent" />
                <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-accent" />
                <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-accent" />
                <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-accent" />
              </>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-[#0c0c14] flex flex-col items-center justify-center p-6 text-center">
                <CameraOff size={28} className="text-red-400 mb-2" />
                <p className="text-xs text-muted leading-relaxed">{cameraError}</p>
                <button
                  onClick={startScanner}
                  className="mt-4 px-3 py-1.5 bg-accent text-white text-xs rounded-md font-semibold cursor-pointer"
                >
                  Aktifkan Kamera
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-3 p-6">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
              <Scan size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-white font-semibold">Mode Input Manual</p>
              <p className="text-[10px] text-muted mt-1 max-w-[200px] mx-auto">
                Ketik atau tempelkan token QR Code yang tertera di aplikasi Member Anda untuk memproses check-in.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input form only shown when on manual tab */}
      {activeTab === "manual" && !result && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
            Token QR Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Masukkan token QR..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isPending}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !token.trim()}
              className="px-4 rounded-lg bg-accent text-white font-medium text-sm flex items-center justify-center hover:bg-accent-hover active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
