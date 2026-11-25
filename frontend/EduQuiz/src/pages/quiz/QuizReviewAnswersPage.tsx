import { ArrowLeft, Flag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AnswerOptionList from "../../components/quiz/AnswerOptionList";
import ReportErrorSheet from "../../components/quiz/ReportErrorSheet";
import { attemptService } from "../../services/attemptService";
import type { AttemptResultDto } from "../../types/attempt";

type ReviewFilter = "ALL" | "CORRECT" | "WRONG" | "UNANSWERED";

/** Figma `EduQuiz_XemLaiDapAn` (215:4661, 239:800) — Full Answer Key + Explanations + Report */
export default function QuizReviewAnswersPage() {
  const { attemptId = "" } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<AttemptResultDto | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void attemptService.getAttemptResult(attemptId).then((res) => {
      if (!active) return;
      setResult(res);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [attemptId]);

  const filteredItems = useMemo(() => {
    if (!result) return [];
    return result.reviewItems.filter((item) => {
      if (filter === "CORRECT") return item.isCorrect;
      if (filter === "WRONG") return !item.isCorrect && !item.isUnanswered;
      if (filter === "UNANSWERED") return item.isUnanswered;
      return true;
    });
  }, [result, filter]);

  if (loading) {
    return <div className="eq-app-skeleton" style={{ height: 340 }} />;
  }

  if (!result) {
    return (
      <div className="eq-app-user-card" style={{ padding: 32, textAlign: "center" }}>
        <h2>Không tìm thấy dữ liệu bài làm</h2>
        <button type="button" className="eq-app-btn-primary" onClick={() => navigate("/history")}>
          Quay về Lịch sử
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div
        className="eq-app-user-card"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            className="eq-app-btn-secondary"
            style={{ height: 36, padding: "0 12px", fontSize: 13 }}
            onClick={() => navigate(`/quiz/result/${attemptId}`)}
          >
            <ArrowLeft size={16} />
            <span>Kết quả</span>
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: 19 }}>
              Xem giải thích đáp án
            </h1>
            <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>
              {result.attempt.quizTitle} · Điểm {(result.attempt.score ?? 0).toFixed(1)}/10
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(
            [
              { key: "ALL", label: `Tất cả (${result.reviewItems.length})` },
              { key: "CORRECT", label: `Đúng (${result.correctCount})` },
              { key: "WRONG", label: `Sai (${result.wrongCount})` },
              { key: "UNANSWERED", label: `Bỏ trống (${result.unansweredCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                border: "none",
                borderRadius: "var(--eq-radius-full)",
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: filter === tab.key ? "var(--eq-primary-quiz)" : "var(--eq-bg-user-surface-subtle)",
                color: filter === tab.key ? "#fff" : "var(--eq-text-secondary)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Review Question Cards */}
      {filteredItems.length === 0 ? (
        <div className="eq-app-user-card" style={{ padding: 28, textAlign: "center", color: "var(--eq-text-muted)" }}>
          Không có câu hỏi nào trong nhóm lọc này.
        </div>
      ) : (
        filteredItems.map((item) => {
          const correctIds = item.options.filter((o) => o.isCorrect).map((o) => o.id);
          const statusLabel = item.isUnanswered ? "Bỏ trống" : item.isCorrect ? "Chính xác" : "Chưa đúng";
          const statusBg = item.isUnanswered
            ? "var(--eq-bg-user-surface-subtle)"
            : item.isCorrect
              ? "var(--eq-status-success-bg)"
              : "var(--eq-status-danger-bg)";
          const statusColor = item.isUnanswered
            ? "var(--eq-text-secondary)"
            : item.isCorrect
              ? "var(--eq-status-success-text)"
              : "var(--eq-status-danger-text)";

          return (
            <article key={item.questionId} className="eq-app-user-card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="eq-app-badge-pill"
                    style={{ background: "var(--eq-primary-quiz-soft)", color: "var(--eq-primary-quiz)" }}
                  >
                    Câu {item.orderIndex}
                  </span>
                  <span className="eq-app-badge-pill" style={{ background: statusBg, color: statusColor }}>
                    {statusLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setReportTarget({
                      id: item.questionId,
                      label: `Câu ${item.orderIndex} · ${result.attempt.quizTitle}`,
                    })
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    border: "1px solid var(--eq-border-user-card)",
                    background: "var(--eq-bg-surface)",
                    borderRadius: "var(--eq-radius-full)",
                    padding: "4px 10px",
                    fontSize: 12,
                    color: "var(--eq-text-muted)",
                    fontWeight: 600,
                  }}
                >
                  <Flag size={13} />
                  <span>Báo lỗi</span>
                </button>
              </div>

              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>
                {item.content}
              </h3>

              <AnswerOptionList
                options={item.options}
                selectedIds={item.selectedOptionIds}
                correctIds={correctIds}
                explanation={item.explanation}
                mode="REVIEW"
              />
            </article>
          );
        })
      )}

      <ReportErrorSheet
        open={Boolean(reportTarget)}
        questionId={reportTarget?.id ?? null}
        questionLabel={reportTarget?.label}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
}
