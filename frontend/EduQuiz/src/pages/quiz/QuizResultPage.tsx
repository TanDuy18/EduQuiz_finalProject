import { Award, BookOpen, CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { attemptService } from "../../services/attemptService";
import type { AttemptResultDto } from "../../types/attempt";

/** Figma `EduQuiz_KetQua` (215:4587) — Score Hero, Breakdown KPIs & Next Actions */
export default function QuizResultPage() {
  const { attemptId = "" } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<AttemptResultDto | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="eq-app-skeleton" style={{ height: 340 }} />;
  }

  if (!result) {
    return (
      <div className="eq-app-user-card" style={{ padding: 32, textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px" }}>Không tìm thấy kết quả bài làm</h2>
        <p style={{ margin: "0 0 18px", color: "var(--eq-text-muted)" }}>
          Bài làm có thể chưa được nộp hoặc không tồn tại trong trình duyệt này.
        </p>
        <Link to="/history" className="eq-app-btn-primary" style={{ textDecoration: "none" }}>
          Xem Lịch sử làm bài
        </Link>
      </div>
    );
  }

  const wrongOrUnansweredIds = result.reviewItems
    .filter((item) => !item.isCorrect)
    .map((item) => item.questionId);
  const score = result.attempt.score ?? 0;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero Score Card */}
      <section
        className="eq-app-user-card"
        style={{
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <span
          className="eq-app-badge-pill"
          style={{
            background: "var(--eq-primary-quiz-soft)",
            color: "var(--eq-primary-quiz)",
            marginBottom: 10,
          }}
        >
          <Award size={14} />
          <span>Hoàn thành bài thi</span>
        </span>

        <h1 style={{ margin: "0 0 6px", fontFamily: "var(--eq-font-heading)", fontSize: 22 }}>
          {result.attempt.quizTitle}
        </h1>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--eq-text-muted)" }}>
          {result.attempt.subjectName} · Vượt qua {result.percentileBeat}% học viên khác
        </p>

        <div
          style={{
            fontFamily: "var(--eq-font-heading)",
            fontSize: "var(--eq-text-score-hero)",
            fontWeight: 800,
            color: score >= 8 ? "var(--eq-status-success-border)" : score >= 5 ? "var(--eq-primary-quiz)" : "var(--eq-status-danger-border)",
            lineHeight: 1.05,
            marginBottom: 6,
          }}
        >
          {score.toFixed(1)}
          <span style={{ fontSize: 26, fontWeight: 600, color: "var(--eq-text-muted)" }}>/10</span>
        </div>

        {/* 3 Breakdown KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 22,
          }}
        >
          <div
            style={{
              background: "var(--eq-status-success-bg)",
              color: "var(--eq-status-success-text)",
              borderRadius: "var(--eq-radius-lg)",
              padding: "14px 10px",
            }}
          >
            <CheckCircle2 size={20} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{result.correctCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Câu đúng</div>
          </div>

          <div
            style={{
              background: "var(--eq-status-danger-bg)",
              color: "var(--eq-status-danger-text)",
              borderRadius: "var(--eq-radius-lg)",
              padding: "14px 10px",
            }}
          >
            <XCircle size={20} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{result.wrongCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Câu sai</div>
          </div>

          <div
            style={{
              background: "var(--eq-bg-user-surface-subtle)",
              color: "var(--eq-text-secondary)",
              border: "1px solid var(--eq-border-user-card)",
              borderRadius: "var(--eq-radius-lg)",
              padding: "14px 10px",
            }}
          >
            <HelpCircle size={20} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{result.unansweredCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Bỏ trống</div>
          </div>
        </div>
      </section>

      {/* Primary Action Buttons */}
      <div
        className="eq-app-user-card"
        style={{
          padding: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
        }}
      >
        <button
          type="button"
          className="eq-app-btn-primary"
          style={{ background: "var(--eq-primary-quiz)" }}
          onClick={() => navigate(`/quiz/result/${attemptId}/review`)}
        >
          <BookOpen size={17} />
          <span>Xem giải thích đáp án</span>
        </button>

        {wrongOrUnansweredIds.length > 0 && (
          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ background: "var(--eq-status-warning-admin)" }}
            onClick={() =>
              navigate(`/quiz/${result.attempt.quizId}`, {
                state: { mode: "RETRY_WRONG", questionIds: wrongOrUnansweredIds },
              })
            }
          >
            <RotateCcw size={17} />
            <span>Làm lại câu sai ({wrongOrUnansweredIds.length})</span>
          </button>
        )}

        <button
          type="button"
          className="eq-app-btn-secondary"
          onClick={() => navigate(`/quiz/${result.attempt.quizId}`)}
        >
          <RotateCcw size={16} />
          <span>Làm lại toàn bộ</span>
        </button>

        <Link to="/exam" className="eq-app-btn-secondary" style={{ textDecoration: "none" }}>
          Về danh sách Đề thi
        </Link>
      </div>
    </div>
  );
}
