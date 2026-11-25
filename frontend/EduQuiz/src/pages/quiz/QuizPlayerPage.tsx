import { AlertTriangle, Bookmark, ChevronLeft, ChevronRight, Clock, Flag, LayoutGrid, LogOut, Send } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ResponsiveModalOrSheet from "../../components/common/ResponsiveModalOrSheet";
import AnswerOptionList from "../../components/quiz/AnswerOptionList";
import QuestionGridSheet, { QuestionGridContent } from "../../components/quiz/QuestionGridSheet";
import ReportErrorSheet from "../../components/quiz/ReportErrorSheet";
import { useQuizAttempt } from "../../hooks/useQuizAttempt";
import type { QuizMode } from "../../types/quiz";

interface QuizPlayerLocationState {
  mode?: QuizMode | "RETRY_WRONG" | "PROCTORED";
  questionIds?: string[];
}

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Figma `EduQuiz_LamBai` (192:1270, 197:1958), `ExitAttemptModal` (208:3700),
 * `UnansweredWarningModal` (208:3701) & `RetryWrong` (227:4968).
 * Anti-leak enforced: UI only receives `QuestionExamDto` (no isCorrect/explanation).
 */
export default function QuizPlayerPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const locState = (location.state ?? {}) as QuizPlayerLocationState;
  const mode = locState.mode ?? "PRACTICE";
  const questionIdsFilter = locState.questionIds;

  const {
    session,
    currentIndex,
    setCurrentIndex,
    remainingSeconds,
    loading,
    submitting,
    error,
    selectOption,
    toggleBookmark,
    submitAttempt,
  } = useQuizAttempt({
    quizId,
    mode,
    questionIdsFilter,
    onSubmitted: (result) => {
      navigate(`/quiz/result/${result.attempt.id}`, { replace: true });
    },
  });

  const [gridOpen, setGridOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [unansweredOpen, setUnansweredOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="eq-app-skeleton" style={{ height: 56 }} />
        <div className="eq-app-skeleton" style={{ height: 360 }} />
      </div>
    );
  }

  if (error || !session || session.questions.length === 0) {
    return (
      <div className="eq-app-user-card" style={{ padding: 32, textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px" }}>Không thể mở phòng làm bài</h2>
        <p style={{ margin: "0 0 18px", color: "var(--eq-text-muted)" }}>
          {error ?? "Bộ đề này chưa có câu hỏi nào."}
        </p>
        <button type="button" className="eq-app-btn-primary" onClick={() => navigate("/exam")}>
          Quay về Đề thi
        </button>
      </div>
    );
  }

  const currentQuestion = session.questions[currentIndex];
  const currentAnswer = session.answers[currentQuestion.id];
  const answeredCount = session.questions.filter((q) => session.answers[q.id]?.answered).length;
  const unansweredCount = session.questions.length - answeredCount;
  const isLowTime = session.attempt.durationSeconds > 0 && remainingSeconds <= 300;
  const progressPct = Math.round(((currentIndex + 1) / session.questions.length) * 100);

  const handleRequestSubmit = () => {
    if (unansweredCount > 0) {
      setUnansweredOpen(true);
    } else {
      void submitAttempt();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Top Session Bar */}
      <div
        className="eq-app-user-card"
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button
            type="button"
            className="eq-app-btn-secondary"
            style={{ height: 36, padding: "0 12px", fontSize: 13 }}
            onClick={() => setExitOpen(true)}
          >
            <LogOut size={15} />
            <span>Thoát</span>
          </button>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--eq-font-heading)",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--eq-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 360,
              }}
            >
              {mode === "RETRY_WRONG" ? `Làm lại câu sai · ${session.attempt.quizTitle}` : session.attempt.quizTitle}
            </div>
            <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>
              Đã trả lời {answeredCount}/{session.questions.length} câu · Tự động lưu
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {session.attempt.durationSeconds > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 36,
                padding: "0 12px",
                borderRadius: "var(--eq-radius-full)",
                background: isLowTime ? "var(--eq-status-danger-bg)" : "var(--eq-primary-quiz-soft)",
                color: isLowTime ? "var(--eq-status-danger-text)" : "var(--eq-primary-quiz)",
                fontFamily: "var(--eq-font-heading)",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <Clock size={15} />
              <span>{formatClock(remainingSeconds)}</span>
            </div>
          )}

          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ height: 36, padding: "0 14px", fontSize: 14, background: "var(--eq-primary-quiz)" }}
            disabled={submitting}
            onClick={handleRequestSubmit}
          >
            <Send size={15} />
            <span>{submitting ? "Đang chấm..." : "Nộp bài"}</span>
          </button>
        </div>
      </div>

      {/* Responsive Split: Question Card (8 cols) + Desktop Navigator Palette (4 cols) */}
      <div className="eq-app-detail-grid">
        <section className="eq-app-user-card" style={{ padding: 22 }}>
          {/* Progress Track */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span
              className="eq-app-badge-pill"
              style={{ background: "var(--eq-primary-quiz-soft)", color: "var(--eq-primary-quiz)" }}
            >
              Câu {currentIndex + 1} / {session.questions.length}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => void toggleBookmark(currentQuestion.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 32,
                  padding: "0 10px",
                  borderRadius: "var(--eq-radius-full)",
                  border: "1px solid var(--eq-border-user-card)",
                  background: currentAnswer?.isBookmarked ? "#fff4db" : "var(--eq-bg-surface)",
                  color: currentAnswer?.isBookmarked ? "var(--eq-status-warning-text)" : "var(--eq-text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Bookmark size={14} fill={currentAnswer?.isBookmarked ? "#f59e0b" : "none"} />
                <span>{currentAnswer?.isBookmarked ? "Đã đánh dấu" : "Đánh dấu"}</span>
              </button>

              <button
                type="button"
                onClick={() => setReportOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 32,
                  padding: "0 10px",
                  borderRadius: "var(--eq-radius-full)",
                  border: "1px solid var(--eq-border-user-card)",
                  background: "var(--eq-bg-surface)",
                  color: "var(--eq-text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Flag size={13} />
                <span>Báo lỗi</span>
              </button>
            </div>
          </div>

          <div
            style={{
              height: 6,
              borderRadius: 99,
              background: "var(--eq-bg-neutral-track)",
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "var(--eq-primary-quiz)",
                transition: "width 0.2s ease",
              }}
            />
          </div>

          {/* Question Prompt */}
          <h2
            style={{
              margin: "0 0 20px",
              fontFamily: "var(--eq-font-body)",
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.55,
              color: "var(--eq-text-primary)",
            }}
          >
            {currentQuestion.content}
          </h2>

          {/* Answer Options (Anti-leak EXAM mode) */}
          <AnswerOptionList
            options={currentQuestion.options}
            selectedIds={currentAnswer?.selectedOptionIds ?? []}
            mode="EXAM"
            disabled={submitting}
            onSelect={(optId) => void selectOption(currentQuestion.id, optId)}
          />

          {/* Bottom Prev / Grid / Next Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginTop: 24,
              paddingTop: 18,
              borderTop: "1px solid var(--eq-border-user-card)",
            }}
          >
            <button
              type="button"
              className="eq-app-btn-secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft size={17} />
              <span>Câu trước</span>
            </button>

            <button
              type="button"
              className="eq-app-btn-secondary eq-app-mobile-grid-trigger"
              onClick={() => setGridOpen(true)}
            >
              <LayoutGrid size={16} />
              <span>Danh sách</span>
            </button>

            {currentIndex < session.questions.length - 1 ? (
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ background: "var(--eq-primary-quiz)" }}
                onClick={() => setCurrentIndex((i) => Math.min(session.questions.length - 1, i + 1))}
              >
                <span>Câu tiếp</span>
                <ChevronRight size={17} />
              </button>
            ) : (
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ background: "var(--eq-status-success-border)" }}
                disabled={submitting}
                onClick={handleRequestSubmit}
              >
                <Send size={16} />
                <span>Nộp bài</span>
              </button>
            )}
          </div>
        </section>

        {/* Desktop Sticky Navigator Panel */}
        <aside className="eq-app-desktop-filter-aside">
          <div className="eq-app-user-card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: "var(--eq-font-heading)", fontSize: 16 }}>
              Bảng câu hỏi
            </h3>
            <QuestionGridContent
              questions={session.questions}
              answers={session.answers}
              currentIndex={currentIndex}
              onJump={setCurrentIndex}
            />
          </div>
        </aside>
      </div>

      {/* Mobile / Tablet Question Grid Sheet */}
      <QuestionGridSheet
        open={gridOpen}
        onClose={() => setGridOpen(false)}
        questions={session.questions}
        answers={session.answers}
        currentIndex={currentIndex}
        onJump={setCurrentIndex}
      />

      {/* Report Question Error Sheet */}
      <ReportErrorSheet
        open={reportOpen}
        questionId={currentQuestion.id}
        questionLabel={`Câu ${currentIndex + 1} · ${session.attempt.quizTitle}`}
        onClose={() => setReportOpen(false)}
      />

      {/* Exit Confirmation Modal (Figma 208:3700) */}
      <ResponsiveModalOrSheet
        open={exitOpen}
        title="Tạm rời khỏi bài thi?"
        subtitle="Tiến độ và các đáp án bạn đã chọn đã được tự động lưu."
        onClose={() => setExitOpen(false)}
      >
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--eq-text-secondary)", lineHeight: 1.55 }}>
          Bạn có thể quay lại làm tiếp bất cứ lúc nào từ mục <strong>Tiếp tục học</strong> hoặc <strong>Lịch sử</strong>.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ flex: 1, background: "var(--eq-primary-quiz)" }}
            onClick={() => setExitOpen(false)}
          >
            Ở lại làm tiếp
          </button>
          <button
            type="button"
            className="eq-app-btn-secondary"
            style={{ flex: 1 }}
            onClick={() => navigate(`/exams/detail/${session.attempt.quizId}`)}
          >
            Thoát ra
          </button>
        </div>
      </ResponsiveModalOrSheet>

      {/* Unanswered Questions Warning Modal (Figma 208:3701) */}
      <ResponsiveModalOrSheet
        open={unansweredOpen}
        title={`Còn ${unansweredCount} câu chưa trả lời`}
        subtitle="Bạn có chắc chắn muốn nộp bài ngay bây giờ?"
        onClose={() => setUnansweredOpen(false)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: 12,
            borderRadius: "var(--eq-radius-lg)",
            background: "#fff4db",
            color: "var(--eq-status-warning-text)",
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Các câu chưa chọn đáp án sẽ không được tính điểm sau khi nộp bài.</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ flex: 1, background: "var(--eq-primary-quiz)" }}
            onClick={() => {
              setUnansweredOpen(false);
              setGridOpen(true);
            }}
          >
            Xem câu chưa làm
          </button>
          <button
            type="button"
            className="eq-app-btn-secondary"
            style={{ flex: 1 }}
            disabled={submitting}
            onClick={() => {
              setUnansweredOpen(false);
              void submitAttempt();
            }}
          >
            Vẫn nộp bài
          </button>
        </div>
      </ResponsiveModalOrSheet>
    </div>
  );
}
