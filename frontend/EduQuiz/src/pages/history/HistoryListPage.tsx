import { Award, CheckCircle2, Clock, Eye, Play, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { attemptService } from "../../services/attemptService";
import type { AttemptRecord, AttemptStatus } from "../../types/attempt";

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Figma `EduQuiz_LichSu` (312:2800) — Attempt History & Summary KPIs */
export default function HistoryListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AttemptStatus | "ALL">("ALL");
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void attemptService.getAttemptHistory("ALL").then((list) => {
      if (!active) return;
      setAttempts(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const submitted = attempts.filter((a) => a.status === "SUBMITTED" && typeof a.score === "number");
    const inProgressCount = attempts.filter((a) => a.status === "IN_PROGRESS").length;
    const avgScore =
      submitted.length > 0
        ? submitted.reduce((sum, a) => sum + (a.score ?? 0), 0) / submitted.length
        : 0;
    const bestScore =
      submitted.length > 0 ? Math.max(...submitted.map((a) => a.score ?? 0)) : 0;
    return {
      total: attempts.length,
      inProgressCount,
      avgScore,
      bestScore,
    };
  }, [attempts]);

  const visibleAttempts = useMemo(
    () => (filter === "ALL" ? attempts : attempts.filter((a) => a.status === filter)),
    [attempts, filter],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: "var(--eq-text-screen-title)" }}>
          Lịch sử làm bài
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--eq-text-muted)" }}>
          Theo dõi tiến độ các bài thi đang làm dở và kết quả luyện tập của bạn
        </p>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <div className="eq-app-user-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--eq-primary-admin)", marginBottom: 6 }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Tổng lượt thi</span>
          </div>
          <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 24, fontWeight: 800 }}>
            {stats.total}
          </div>
        </div>

        <div className="eq-app-user-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--eq-status-warning-admin)", marginBottom: 6 }}>
            <Clock size={18} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Đang làm dở</span>
          </div>
          <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 24, fontWeight: 800 }}>
            {stats.inProgressCount}
          </div>
        </div>

        <div className="eq-app-user-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--eq-primary-quiz)", marginBottom: 6 }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Điểm trung bình</span>
          </div>
          <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 24, fontWeight: 800 }}>
            {stats.avgScore.toFixed(1)}/10
          </div>
        </div>

        <div className="eq-app-user-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--eq-status-success-border)", marginBottom: 6 }}>
            <Award size={18} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Điểm cao nhất</span>
          </div>
          <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 24, fontWeight: 800 }}>
            {stats.bestScore.toFixed(1)}/10
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(
          [
            { key: "ALL", label: "Tất cả" },
            { key: "IN_PROGRESS", label: "Đang làm dở" },
            { key: "SUBMITTED", label: "Đã hoàn thành" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            style={{
              border: filter === tab.key ? "none" : "1px solid var(--eq-border-user-card)",
              borderRadius: "var(--eq-radius-full)",
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              background: filter === tab.key ? "var(--eq-primary-admin)" : "var(--eq-bg-surface)",
              color: filter === tab.key ? "#fff" : "var(--eq-text-secondary)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Attempt Cards */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="eq-app-skeleton" style={{ height: 108 }} />
          <div className="eq-app-skeleton" style={{ height: 108 }} />
        </div>
      ) : visibleAttempts.length === 0 ? (
        <div className="eq-app-user-card" style={{ padding: "36px 24px", textAlign: "center" }}>
          <h3 style={{ margin: "0 0 8px" }}>Chưa có lịch sử làm bài</h3>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--eq-text-muted)" }}>
            Chọn một đề thi để bắt đầu luyện tập và lưu kết quả tự động.
          </p>
          <Link to="/exam" className="eq-app-btn-primary" style={{ textDecoration: "none" }}>
            Khám phá Đề thi
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visibleAttempts.map((att) => {
            const isInProgress = att.status === "IN_PROGRESS";
            const pct = Math.min(100, Math.round((att.answeredCount / Math.max(1, att.totalCount)) * 100));

            return (
              <article
                key={att.id}
                className="eq-app-user-card"
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span
                      className="eq-app-badge-pill"
                      style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-action)" }}
                    >
                      {att.subjectName}
                    </span>
                    <span
                      className="eq-app-badge-pill"
                      style={{
                        background: isInProgress ? "#fff4db" : "var(--eq-status-success-bg)",
                        color: isInProgress ? "var(--eq-status-warning-text)" : "var(--eq-status-success-text)",
                      }}
                    >
                      {isInProgress ? "Đang làm dở" : "Đã nộp bài"}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>
                      {formatShortDate(att.submittedAt ?? att.startedAt)}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 8px", fontFamily: "var(--eq-font-heading)", fontSize: 16 }}>
                    {att.quizTitle}
                  </h3>

                  {isInProgress ? (
                    <div style={{ maxWidth: 340 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--eq-text-muted)" }}>
                          Đã trả lời {att.answeredCount}/{att.totalCount} câu
                        </span>
                        <strong style={{ color: "var(--eq-primary-progress)" }}>{pct}%</strong>
                      </div>
                      <div
                        style={{
                          height: 7,
                          borderRadius: 99,
                          background: "var(--eq-bg-progress-track)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "var(--eq-primary-progress)",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--eq-text-secondary)" }}>
                      Kết quả:{" "}
                      <strong style={{ color: "var(--eq-primary-quiz)", fontSize: 15 }}>
                        {(att.score ?? 0).toFixed(1)}/10
                      </strong>{" "}
                      ({att.correctCount ?? 0}/{att.totalCount} câu đúng)
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {isInProgress ? (
                    <>
                      <button
                        type="button"
                        className="eq-app-btn-secondary"
                        style={{ height: 38, padding: "0 12px", fontSize: 13 }}
                        onClick={() => navigate(`/history/${att.id}`)}
                      >
                        <Eye size={15} />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        type="button"
                        className="eq-app-btn-primary"
                        style={{ height: 38, padding: "0 14px", fontSize: 13, background: "var(--eq-primary-quiz)" }}
                        onClick={() => navigate(`/quiz/${att.quizId}`)}
                      >
                        <Play size={14} fill="currentColor" />
                        <span>Tiếp tục làm</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="eq-app-btn-secondary"
                        style={{ height: 38, padding: "0 12px", fontSize: 13 }}
                        onClick={() => navigate(`/quiz/result/${att.id}/review`)}
                      >
                        <span>Giải thích</span>
                      </button>
                      <button
                        type="button"
                        className="eq-app-btn-primary"
                        style={{ height: 38, padding: "0 14px", fontSize: 13, background: "var(--eq-primary-action)" }}
                        onClick={() => navigate(`/quiz/result/${att.id}`)}
                      >
                        <span>Xem kết quả</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
