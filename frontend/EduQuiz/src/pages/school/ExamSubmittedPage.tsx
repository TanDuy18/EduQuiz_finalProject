import { CameraOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { attemptService } from "../../services/attemptService";
import { proctoringService } from "../../services/proctoringService";
import type { AttemptResultDto } from "../../types/attempt";
import type { ProctoringViolationEvent } from "../../types/proctoring";

/** Post-Proctored Exam Submitted Screen — confirms hardware camera stop + integrity timeline */
export default function ExamSubmittedPage() {
  const { attemptId = "" } = useParams<{ assignedExamId: string; attemptId: string }>();
  const [result, setResult] = useState<AttemptResultDto | null>(null);
  const [logs, setLogs] = useState<ProctoringViolationEvent[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      attemptService.getAttemptResult(attemptId),
      proctoringService.getViolationsByAttempt(attemptId),
    ]).then(([res, events]) => {
      if (!active) return;
      setResult(res);
      setLogs(events);
    });
    return () => {
      active = false;
    };
  }, [attemptId]);

  const warningLogs = logs.filter((l) => l.severity !== "INFO");

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <section className="eq-app-user-card" style={{ padding: "32px 24px", textAlign: "center" }}>
        <CheckCircle2 size={54} color="var(--eq-status-success-border)" style={{ marginBottom: 12 }} />
        <h1 style={{ margin: "0 0 8px", fontFamily: "var(--eq-font-heading)", fontSize: 24 }}>
          Đã nộp bài thi giám sát AI thành công
        </h1>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--eq-text-muted)" }}>
          {result?.attempt.quizTitle ?? "Bài kiểm tra trực tuyến"}
        </p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 99, background: "var(--eq-status-success-bg)", color: "var(--eq-status-success-text)", fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
          <CameraOff size={16} />
          <span>Camera đã được ngắt phần cứng an toàn (track.stop)</span>
        </div>

        {result && (
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--eq-primary-quiz)", marginBottom: 20 }}>
            Điểm tạm tính: {(result.attempt.score ?? 0).toFixed(1)}/10 ({result.correctCount}/{result.attempt.totalCount} câu đúng)
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to={`/quiz/result/${attemptId}/review`}
            className="eq-app-btn-primary"
            style={{ textDecoration: "none", background: "var(--eq-primary-quiz)" }}
          >
            Xem giải thích đáp án
          </Link>
          <Link to="/school" className="eq-app-btn-secondary" style={{ textDecoration: "none" }}>
            Về danh sách Trường học
          </Link>
        </div>
      </section>

      {/* Integrity Event Log */}
      <section className="eq-app-user-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={18} color="var(--eq-primary-admin)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Nhật ký giám sát phiên thi ({warningLogs.length} cảnh báo / {logs.length} sự kiện)
          </h2>
        </div>

        {logs.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--eq-text-muted)" }}>
            Không ghi nhận sự kiện bất thường trong suốt phiên làm bài.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "var(--eq-bg-user-surface-subtle)",
                  border: "1px solid var(--eq-border-user-card)",
                  fontSize: 13,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{ev.violationType}</strong>: {ev.message}
                </div>
                <span style={{ fontSize: 11, color: "var(--eq-text-muted)" }}>
                  {new Date(ev.timestamp).toLocaleTimeString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
