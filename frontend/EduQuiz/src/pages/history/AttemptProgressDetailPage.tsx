import { ArrowLeft, Bookmark, Clock, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attemptService } from "../../services/attemptService";
import type { AttemptAnswerRecord, AttemptRecord } from "../../types/attempt";

/** Figma `EduQuiz_ChiTietTienDo` (295:2408) — Per-Question Progress Overview before Resuming */
export default function AttemptProgressDetailPage() {
  const { attemptId = "" } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<{
    attempt: AttemptRecord;
    answers: AttemptAnswerRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void attemptService.getAttemptProgress(attemptId).then((res) => {
      if (!active) return;
      setData(res);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [attemptId]);

  if (loading) {
    return <div className="eq-app-skeleton" style={{ height: 320 }} />;
  }

  if (!data) {
    return (
      <div className="eq-app-user-card" style={{ padding: 32, textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px" }}>Không tìm thấy tiến độ bài làm</h2>
        <button type="button" className="eq-app-btn-primary" onClick={() => navigate("/history")}>
          Quay về Lịch sử
        </button>
      </div>
    );
  }

  const { attempt, answers } = data;
  const answerByOrder = new Map(answers.map((a) => [a.orderIndex, a]));
  const totalSlots = Math.max(attempt.totalCount, answers.length);
  const pct = Math.min(100, Math.round((attempt.answeredCount / Math.max(1, totalSlots)) * 100));
  const remMins = Math.ceil(attempt.remainingSeconds / 60);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <button
          type="button"
          className="eq-app-btn-secondary"
          style={{ height: 36, padding: "0 12px", fontSize: 13 }}
          onClick={() => navigate("/history")}
        >
          <ArrowLeft size={16} />
          <span>Quay về Lịch sử</span>
        </button>
      </div>

      <section className="eq-app-user-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <span
              className="eq-app-badge-pill"
              style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-action)", marginBottom: 8 }}
            >
              {attempt.subjectName}
            </span>
            <h1 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: 22 }}>
              {attempt.quizTitle}
            </h1>
          </div>

          {attempt.status === "IN_PROGRESS" ? (
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ background: "var(--eq-primary-quiz)" }}
              onClick={() => navigate(`/quiz/${attempt.quizId}`)}
            >
              <Play size={17} fill="currentColor" />
              <span>Tiếp tục làm bài</span>
            </button>
          ) : (
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ background: "var(--eq-primary-action)" }}
              onClick={() => navigate(`/quiz/result/${attempt.id}`)}
            >
              Xem kết quả bài thi
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span>
              Đã hoàn thành <strong>{attempt.answeredCount}/{totalSlots}</strong> câu hỏi
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--eq-primary-progress)", fontWeight: 700 }}>
              <Clock size={14} />
              <span>Còn ~{remMins} phút ({pct}%)</span>
            </span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 99,
              background: "var(--eq-bg-progress-track)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--eq-primary-progress)" }} />
          </div>
        </div>

        {/* Per-question status grid */}
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Trạng thái từng câu hỏi</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(54px, 1fr))",
            gap: 10,
          }}
        >
          {Array.from({ length: totalSlots }).map((_, idx) => {
            const order = idx + 1;
            const ans = answerByOrder.get(order);
            const answered = Boolean(ans?.answered);
            const bookmarked = Boolean(ans?.isBookmarked);

            return (
              <div
                key={order}
                style={{
                  position: "relative",
                  height: 46,
                  borderRadius: "var(--eq-radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--eq-font-heading)",
                  fontSize: 15,
                  fontWeight: 700,
                  background: answered ? "var(--eq-status-success-bg)" : "var(--eq-bg-user-surface-subtle)",
                  border: answered
                    ? "1.5px solid var(--eq-status-success-border)"
                    : "1.5px solid var(--eq-border-user-card)",
                  color: answered ? "var(--eq-status-success-text)" : "var(--eq-text-secondary)",
                }}
              >
                {order}
                {bookmarked && (
                  <Bookmark
                    size={12}
                    fill="#f59e0b"
                    color="#f59e0b"
                    style={{ position: "absolute", top: 4, right: 4 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
