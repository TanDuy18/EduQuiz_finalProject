import { Bookmark } from "lucide-react";
import { useState } from "react";
import type { AttemptAnswerRecord } from "../../types/attempt";
import type { QuestionExamDto } from "../../types/quiz";
import ResponsiveModalOrSheet from "../common/ResponsiveModalOrSheet";

interface QuestionGridContentProps {
  questions: QuestionExamDto[];
  answers: Record<string, AttemptAnswerRecord>;
  currentIndex: number;
  onJump: (index: number) => void;
}

type GridFilter = "ALL" | "UNANSWERED" | "BOOKMARKED";

/** Reusable Question Palette Grid (Figma 200:2206) — renders both inline on Desktop and inside Sheet on Mobile */
export function QuestionGridContent({
  questions,
  answers,
  currentIndex,
  onJump,
}: QuestionGridContentProps) {
  const [filter, setFilter] = useState<GridFilter>("ALL");

  const answeredCount = questions.filter((q) => answers[q.id]?.answered).length;
  const bookmarkedCount = questions.filter((q) => answers[q.id]?.isBookmarked).length;
  const unansweredCount = questions.length - answeredCount;

  const visibleIndices = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => {
      const ans = answers[q.id];
      if (filter === "UNANSWERED") return !ans?.answered;
      if (filter === "BOOKMARKED") return Boolean(ans?.isBookmarked);
      return true;
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary Counters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <div
          style={{
            background: "var(--eq-status-success-bg)",
            color: "var(--eq-status-success-text)",
            borderRadius: "var(--eq-radius-md)",
            padding: "8px 6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>{answeredCount}</div>
          <div style={{ fontSize: 11 }}>Đã làm</div>
        </div>
        <div
          style={{
            background: "var(--eq-bg-user-surface-subtle)",
            color: "var(--eq-text-secondary)",
            borderRadius: "var(--eq-radius-md)",
            padding: "8px 6px",
            textAlign: "center",
            border: "1px solid var(--eq-border-user-card)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>{unansweredCount}</div>
          <div style={{ fontSize: 11 }}>Chưa làm</div>
        </div>
        <div
          style={{
            background: "#fff4db",
            color: "var(--eq-status-warning-text)",
            borderRadius: "var(--eq-radius-md)",
            padding: "8px 6px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>{bookmarkedCount}</div>
          <div style={{ fontSize: 11 }}>Đánh dấu</div>
        </div>
      </div>

      {/* Filter Pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(
          [
            { key: "ALL", label: "Tất cả" },
            { key: "UNANSWERED", label: `Chưa làm (${unansweredCount})` },
            { key: "BOOKMARKED", label: `Đánh dấu (${bookmarkedCount})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            style={{
              border: "none",
              borderRadius: "var(--eq-radius-full)",
              padding: "5px 10px",
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

      {/* Number Grid */}
      {visibleIndices.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--eq-text-muted)", textAlign: "center", padding: "16px 0" }}>
          Không có câu hỏi trong mục này.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {visibleIndices.map(({ q, idx }) => {
            const ans = answers[q.id];
            const isCurrent = idx === currentIndex;
            const isAnswered = Boolean(ans?.answered);
            const isBookmarked = Boolean(ans?.isBookmarked);

            let bg = "var(--eq-bg-user-surface-subtle)";
            let border = "1.5px solid var(--eq-border-user-card)";
            let color = "var(--eq-text-secondary)";

            if (isCurrent) {
              bg = "var(--eq-primary-quiz)";
              border = "1.5px solid var(--eq-primary-quiz)";
              color = "#fff";
            } else if (isAnswered) {
              bg = "var(--eq-status-success-bg)";
              border = "1.5px solid var(--eq-status-success-border)";
              color = "var(--eq-status-success-text)";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onJump(idx)}
                style={{
                  position: "relative",
                  height: 40,
                  borderRadius: "var(--eq-radius-md)",
                  background: bg,
                  border,
                  color,
                  fontFamily: "var(--eq-font-heading)",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {idx + 1}
                {isBookmarked && (
                  <Bookmark
                    size={11}
                    fill="#f59e0b"
                    color="#f59e0b"
                    style={{ position: "absolute", top: 3, right: 3 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface QuestionGridSheetProps extends QuestionGridContentProps {
  open: boolean;
  onClose: () => void;
}

export default function QuestionGridSheet({
  open,
  onClose,
  questions,
  answers,
  currentIndex,
  onJump,
}: QuestionGridSheetProps) {
  return (
    <ResponsiveModalOrSheet
      open={open}
      title="Danh sách câu hỏi"
      subtitle="Bấm vào số câu để chuyển nhanh"
      onClose={onClose}
    >
      <QuestionGridContent
        questions={questions}
        answers={answers}
        currentIndex={currentIndex}
        onJump={(idx) => {
          onJump(idx);
          onClose();
        }}
      />
    </ResponsiveModalOrSheet>
  );
}
