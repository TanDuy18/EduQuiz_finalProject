import { Link } from "react-router-dom";
import iconStarRating from "../../assets/figma/icon-star-rating.png";
import type { QuizRecord } from "../../types/quiz";

interface ExamCardProps {
  quiz: QuizRecord;
  progressPercent?: number;
}

function getSubjectBoxStyle(subjectName: string): { bg: string; color: string } {
  const s = subjectName.toLowerCase();
  if (s.includes("toán")) return { bg: "var(--eq-subject-math-bg)", color: "var(--eq-subject-math-text)" };
  if (s.includes("văn")) return { bg: "var(--eq-subject-literature-bg)", color: "var(--eq-subject-literature-text)" };
  if (s.includes("lý") || s.includes("lí")) return { bg: "var(--eq-subject-physics-bg)", color: "var(--eq-subject-physics-text)" };
  if (s.includes("hóa") || s.includes("hoá")) return { bg: "var(--eq-subject-chemistry-bg)", color: "var(--eq-subject-chemistry-text)" };
  if (s.includes("anh") || s.includes("ngoại")) return { bg: "var(--eq-subject-english-bg)", color: "var(--eq-subject-english-text)" };
  if (s.includes("sử")) return { bg: "var(--eq-subject-history-bg)", color: "var(--eq-subject-history-text)" };
  return { bg: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-action)" };
}

/** Figma Exam Card (181:447, 181:489, 215:3992) */
export default function ExamCard({ quiz, progressPercent }: ExamCardProps) {
  const palette = getSubjectBoxStyle(quiz.subjectName);
  const showProgress = typeof progressPercent === "number" && progressPercent > 0;

  return (
    <Link to={`/exams/detail/${quiz.id}`} className="eq-app-exam-card">
      <div
        className="eq-app-exam-count-box"
        style={{ background: palette.bg, color: palette.color }}
      >
        <span className="eq-app-exam-count-num">
          {showProgress ? `${progressPercent}%` : quiz.questionCount}
        </span>
        <span className="eq-app-exam-count-lbl">{showProgress ? "đã làm" : "câu"}</span>
      </div>

      <div className="eq-app-exam-body">
        <div className="eq-app-exam-badges">
          <span
            className="eq-app-badge-pill"
            style={{ background: palette.bg, color: palette.color }}
          >
            {quiz.subjectName}
          </span>
          {quiz.isPopular && (
            <span className="eq-app-badge-pill eq-app-badge-popular">Phổ biến</span>
          )}
          {quiz.topicTag && (
            <span
              className="eq-app-badge-pill"
              style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-action)" }}
            >
              {quiz.topicTag}
            </span>
          )}
        </div>

        <h3 className="eq-app-exam-title">{quiz.title}</h3>

        <div className="eq-app-exam-meta">
          <span>{quiz.durationMinutes} phút</span>
          <span>·</span>
          <span>{quiz.attemptCountLabel} lượt</span>
          {quiz.rating > 0 && (
            <>
              <span>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <img src={iconStarRating} alt="" width={13} height={13} />
                {quiz.rating.toFixed(1)}/5
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
