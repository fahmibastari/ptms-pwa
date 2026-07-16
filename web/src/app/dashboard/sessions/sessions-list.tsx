"use client";

import { useState, useTransition, Fragment } from "react";
import { format } from "date-fns";
import { upsertSessionNote } from "@/lib/actions/session-notes";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

type SessionNote = {
  id: string;
  goal: string;
  execution: string;
  feedback: string;
  nextSteps: string;
} | null;

type SessionRow = {
  id: string;
  date: Date;
  createdAt: Date;
  checkInType: string | null;
  status: string;
  member: { user: { fullName: string; email: string } };
  trainer: { user: { fullName: string } } | null;
  sessionNote: SessionNote;
};

interface SessionsListProps {
  sessions: SessionRow[];
  canEditNotes: boolean;
}

export function SessionsList({ sessions, canEditNotes }: SessionsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [forms, setForms] = useState<Record<string, {
    goal: string;
    execution: string;
    feedback: string;
    nextSteps: string;
  }>>(() =>
    Object.fromEntries(
      sessions.map((s) => [
        s.id,
        {
          goal: s.sessionNote?.goal ?? "",
          execution: s.sessionNote?.execution ?? "",
          feedback: s.sessionNote?.feedback ?? "",
          nextSteps: s.sessionNote?.nextSteps ?? "",
        },
      ])
    )
  );

  const handleSave = (attendanceId: string) => {
    setError(null);
    setSuccess(null);
    const data = forms[attendanceId];
    if (!data) return;

    startTransition(async () => {
      const res = await upsertSessionNote(attendanceId, data);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setSuccess("Catatan sesi berhasil disimpan.");
      setTimeout(() => setSuccess(null), 3000);
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-error-border bg-error-surface px-4 py-3 text-sm text-error-ink">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success-border bg-success-surface px-4 py-3 text-sm text-success-ink">
          {success}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-card-border bg-gray-50">
                <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Tanggal & Waktu</th>
                <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Member</th>
                <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Trainer</th>
                <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider">Metode</th>
                <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider text-right">Status</th>
                {(canEditNotes || sessions.some((s) => s.sessionNote)) && (
                  <th className="px-6 py-3.5 text-[11px] font-medium text-muted uppercase tracking-wider text-right">Catatan</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => {
                const isExpanded = expandedId === session.id;
                const hasNote = !!session.sessionNote;
                return (
                  <Fragment key={session.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-foreground">
                          <Calendar size={13} className="text-muted" />
                          <span>{format(new Date(session.date), "dd MMM yyyy")}</span>
                          <span className="text-muted">•</span>
                          <Clock size={13} className="text-muted" />
                          <span>{format(new Date(session.createdAt), "HH:mm")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-muted font-bold border border-gray-200">
                            {(session.member.user.fullName?.[0] || "M").toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{session.member.user.fullName}</p>
                            <p className="text-[10px] text-muted">{session.member.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-muted" />
                          <span className="text-xs text-foreground">
                            {session.trainer?.user.fullName || "Staf PTMS"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] text-muted bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-mono">
                          {session.checkInType || "MANUAL"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] text-success-ink font-semibold bg-success-surface border border-success-border px-2 py-1 rounded-md">
                          <CheckCircle size={10} /> {session.status}
                        </span>
                      </td>
                      {(canEditNotes || sessions.some((s) => s.sessionNote)) && (
                        <td className="px-6 py-4 text-right">
                          {(canEditNotes || hasNote) && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : session.id)}
                              className="inline-flex items-center gap-1 text-[10px] text-accent font-semibold bg-accent/10 border border-accent/20 px-2 py-1 rounded-md cursor-pointer"
                            >
                              <FileText size={10} />
                              {hasNote ? "Lihat" : "Tulis"}
                              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-5">
                          {canEditNotes ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
                              {(
                                [
                                  ["goal", "Tujuan Latihan"],
                                  ["execution", "Pelaksanaan"],
                                  ["feedback", "Feedback"],
                                  ["nextSteps", "Langkah Berikutnya"],
                                ] as const
                              ).map(([field, label]) => (
                                <div key={field} className={field === "feedback" || field === "nextSteps" ? "md:col-span-2" : ""}>
                                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                                    {label}
                                  </label>
                                  <textarea
                                    value={forms[session.id]?.[field] ?? ""}
                                    onChange={(e) =>
                                      setForms((prev) => ({
                                        ...prev,
                                        [session.id]: {
                                          ...prev[session.id],
                                          [field]: e.target.value,
                                        },
                                      }))
                                    }
                                    rows={2}
                                    className="auth-input text-xs resize-none"
                                  />
                                </div>
                              ))}
                              <div className="md:col-span-2">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleSave(session.id)}
                                  className="px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                                  style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
                                >
                                  {isPending ? "Menyimpan..." : "Simpan Catatan"}
                                </button>
                              </div>
                            </div>
                          ) : session.sessionNote ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl text-xs">
                              <div>
                                <p className="text-[10px] text-muted uppercase font-bold mb-1">Tujuan</p>
                                <p className="text-foreground">{session.sessionNote.goal}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted uppercase font-bold mb-1">Pelaksanaan</p>
                                <p className="text-foreground">{session.sessionNote.execution}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-[10px] text-muted uppercase font-bold mb-1">Feedback</p>
                                <p className="text-foreground">{session.sessionNote.feedback}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-[10px] text-muted uppercase font-bold mb-1">Langkah Berikutnya</p>
                                <p className="text-foreground">{session.sessionNote.nextSteps}</p>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
