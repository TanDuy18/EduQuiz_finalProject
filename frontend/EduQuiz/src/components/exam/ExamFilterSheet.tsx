import { useState } from "react";
import type { Difficulty, SubjectDto } from "../../types/quiz";
import ResponsiveModalOrSheet from "../common/ResponsiveModalOrSheet";
import SegmentedSelector from "../common/SegmentedSelector";
import SubjectChip from "../common/SubjectChip";

export interface ExamFilterState {
  subjectIds: string[];
  examType: "ALL" | "POPULAR" | "MOCK" | "TOPIC";
  difficulty: Difficulty | "ALL";
}

interface ExamFilterSheetProps {
  open: boolean;
  subjects: SubjectDto[];
  value: ExamFilterState;
  onApply: (next: ExamFilterState) => void;
  onOpenAllSubjects: () => void;
  onClose: () => void;
}

const EXAM_TYPES: { key: ExamFilterState["examType"]; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "POPULAR", label: "Phổ biến" },
  { key: "MOCK", label: "Đề thi thử" },
  { key: "TOPIC", label: "Theo chuyên đề" },
];

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Dễ", value: "EASY" },
  { label: "Trung bình", value: "MEDIUM" },
  { label: "Khó", value: "HARD" },
];

/** Figma `EduQuiz_LocDeThi_Mobile 1` (312:3274) — Responsive Filter Sheet */
export default function ExamFilterSheet({
  open,
  subjects,
  value,
  onApply,
  onOpenAllSubjects,
  onClose,
}: ExamFilterSheetProps) {
  const [draft, setDraft] = useState<ExamFilterState>(value);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(value);
  }

  const toggleSubject = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(id)
        ? prev.subjectIds.filter((x) => x !== id)
        : [...prev.subjectIds, id],
    }));
  };

  return (
    <ResponsiveModalOrSheet
      open={open}
      title="Lọc đề thi"
      subtitle="Kết hợp nhiều môn học, loại đề và độ khó"
      onClose={onClose}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Môn học */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 14, color: "var(--eq-text-primary)" }}>Môn học</strong>
            <button
              type="button"
              onClick={() => {
                onApply(draft);
                onClose();
                onOpenAllSubjects();
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--eq-primary-action)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Môn khác (24)
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {subjects.slice(0, 8).map((sub) => (
              <SubjectChip
                key={sub.id}
                label={sub.name}
                tone={sub.colorKey}
                selected={draft.subjectIds.includes(sub.id)}
                onClick={() => toggleSubject(sub.id)}
              />
            ))}
          </div>
        </div>

        {/* Loại đề */}
        <div>
          <strong style={{ display: "block", fontSize: 14, marginBottom: 10, color: "var(--eq-text-primary)" }}>
            Loại đề
          </strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXAM_TYPES.map((t) => {
              const active = draft.examType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, examType: t.key }))}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    borderRadius: "var(--eq-radius-full)",
                    border: active ? "none" : "1px solid var(--eq-border-default)",
                    background: active ? "var(--eq-primary-chip)" : "var(--eq-bg-surface)",
                    color: active ? "#fff" : "var(--eq-text-secondary)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Độ khó */}
        <div>
          <strong style={{ display: "block", fontSize: 14, marginBottom: 10, color: "var(--eq-text-primary)" }}>
            Độ khó
          </strong>
          <SegmentedSelector
            ariaLabel="Chọn độ khó"
            options={DIFFICULTY_OPTIONS}
            value={draft.difficulty}
            onChange={(difficulty) => setDraft((prev) => ({ ...prev, difficulty }))}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button
            type="button"
            className="eq-app-btn-secondary"
            style={{ flex: 1 }}
            onClick={() =>
              setDraft({
                subjectIds: [],
                examType: "ALL",
                difficulty: "ALL",
              })
            }
          >
            Đặt lại
          </button>
          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ flex: 1, background: "var(--eq-primary-action)" }}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Áp dụng
          </button>
        </div>
      </div>
    </ResponsiveModalOrSheet>
  );
}
