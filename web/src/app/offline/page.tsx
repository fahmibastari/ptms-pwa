import Link from "next/link";
import { WifiOff, ArrowLeft } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0f] text-white">
      <div className="text-center max-w-md">
        <WifiOff size={40} className="text-accent mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Anda sedang offline</h1>
        <p className="text-muted text-sm mb-6 leading-relaxed">
          Koneksi internet tidak tersedia. Beberapa fitur PTMS membutuhkan koneksi aktif,
          terutama QR absensi dan sinkronisasi data.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
