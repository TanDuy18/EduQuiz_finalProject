import { CalendarClock, Camera, Clock, FileText, GraduationCap, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { proctoringService } from "../../services/proctoringService";
import type { AssignedExamDto, AssignedExamStatus } from "../../types/proctoring";

/** Figma `EduQuiz_TruongHoc` (318:3520) — Assigned School Exams */
export default function AssignedExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<AssignedExamDto[]>([]);
  const [tab, setTab] = useState<"ALL" | AssignedExamStatus>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void proctoringService.getAssignedExams().then((list) => {
      if (!active) return;
      setExams(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () => (tab === "ALL" ? exams : exams.filter((e) => e.status === tab)),
    [exams, tab],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: "var(--eq-text-screen-title)" }}>
          Đề thi Trường học
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--eq-text-muted)" }}>
          Các bài kiểm tra định kỳ do giảng viên và nhà trường giao kèm quy trình giám sát AI
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(
          [
            { key: "ALL", label: "Tất cả" },
            { key: "OPEN", label: "Đang mở" },
            { key: "UPCOMING", label: "Sắp diễn ra" },
            { key: "CLOSED", label: "Đã đóng" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            style={{
              border: tab === item.key ? "none" : "1px solid var(--eq-border-user-card)",
              borderRadius: "var(--eq-radius-full)",
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              background: tab === item.key ? "var(--eq-primary-admin)" : "var(--eq-bg-surface)",
              color: tab === item.key ? "#fff" : "var(--eq-text-secondary)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="eq-app-exams-grid">
          <div className="eq-app-skeleton" style={{ height: 170 }} />
          <div className="eq-app-skeleton" style={{ height: 170 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="eq-app-user-card" style={{ padding: 32, textAlign: "center", color: "var(--eq-text-muted)" }}>
          Chưa có đề kiểm tra nào trong mục này.
        </div>
      ) : (
        <div className="eq-app-exams-grid">
          {filtered.map((exam) => {
            const isOpen = exam.status === "OPEN";
            const isUpcoming = exam.status === "UPCOMING";

            return (
              <article
                key={exam.id}
                className="eq-app-user-card"
                style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}
              >
                <div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    <span
                      className="eq-app-badge-pill"
                      style={{
                        background: isOpen ? "var(--eq-status-success-bg)" : isUpcoming ? "#fff4db" : "#f1f5f9",
                        color: isOpen
                          ? "var(--eq-status-success-text-dark)"
                          : isUpcoming
                            ? "var(--eq-status-warning-text)"
                            : "var(--eq-text-muted)",
                      }}
                    >
                      {isOpen ? "Đang mở" : isUpcoming ? "Sắp diễn ra" : "Đã đóng"}
                    </span>
                    <span
                      className="eq-app-badge-pill"
                      style={{ background: "#fff0e0", color: "var(--eq-badge-midterm-text)" }}
                    >
                      {exam.examTag}
                    </span>
                    {exam.proctoringRequired && (
                      <span
                        className="eq-app-badge-pill"
                        style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-admin)" }}
                      >
                        <Camera size={12} />
                        <span>Giám sát AI</span>
                      </span>
                    )}
                  </div>

                  <h2 style={{ margin: "0 0 6px", fontFamily: "var(--eq-font-heading)", fontSize: 18 }}>
                    {exam.title}
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--eq-text-muted)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <GraduationCap size={14} />
                      <span>{exam.lecturerName} · Lớp {exam.classGroup}</span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <CalendarClock size={14} />
                      <span>{exam.remainingWindowLabel}</span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <FileText size={14} />
                        {exam.questionCount} câu
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={14} />
                        {exam.durationMinutes} phút
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="eq-app-btn-primary"
                  disabled={!isOpen}
                  style={{
                    width: "100%",
                    height: 40,
                    fontSize: 14,
                    background: isOpen ? "var(--eq-primary-quiz)" : undefined,
                  }}
                  onClick={() => navigate(`/school/exam/${exam.id}/briefing`)}
                >
                  <ShieldCheck size={16} />
                  <span>{isOpen ? "Vào phòng kiểm tra" : isUpcoming ? "Chưa tới giờ mở đề" : "Đã hết hạn nộp"}</span>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
