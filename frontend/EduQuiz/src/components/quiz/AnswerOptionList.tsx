import type { QuestionOptionExamDto, QuestionOptionRecord } from "../../types/quiz";

interface AnswerOptionListProps {
  options: (QuestionOptionExamDto | QuestionOptionRecord)[];
  selectedIds: string[];
  mode: "EXAM" | "REVIEW";
  correctIds?: string[];
  explanation?: string;
  disabled?: boolean;
  onSelect?: (optionId: string) => void;
}

/**
 * Figma Component Sets `DapAn` (197:1958), `DapAn19` (208:3419) & `DapAn36` (239:800)
 * Supports all 5 visual states: default, selected, correct, wrong, and explanation card.
 */
export default function AnswerOptionList({
  options,
  selectedIds,
  mode,
  correctIds = [],
  explanation,
  disabled = false,
  onSelect,
}: AnswerOptionListProps) {
  return (
    <div className="eq-app-answer-list">
      {options.map((opt) => {
        const isSelected = selectedIds.includes(opt.id);
        const isCorrect = mode === "REVIEW" && correctIds.includes(opt.id);
        const isWrong = mode === "REVIEW" && isSelected && !isCorrect;

        let stateClass = "";
        if (mode === "REVIEW") {
          if (isCorrect) stateClass = "correct";
          else if (isWrong) stateClass = "wrong";
        } else if (isSelected) {
          stateClass = "selected";
        }

        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled || mode === "REVIEW"}
            className={`eq-app-answer-item ${stateClass}`}
            onClick={() => onSelect?.(opt.id)}
          >
            <span className="eq-app-answer-badge">{opt.label}</span>
            <span style={{ flex: 1 }}>{opt.content}</span>
          </button>
        );
      })}

      {mode === "REVIEW" && explanation && (
        <div className="eq-app-explanation-box">
          <strong>Giải thích: </strong>
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
}
