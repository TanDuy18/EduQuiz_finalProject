import { useState } from "react";
import { useUI } from "../../context/UIContext";
import { attemptService } from "../../services/attemptService";
import type { QuestionReportReason } from "../../types/attempt";
import ResponsiveModalOrSheet from "../common/ResponsiveModalOrSheet";

interface ReportErrorSheetProps {
  open: boolean;
  questionId: string | null;
  questionLabel?: string;
  onClose: () => void;
}

const REASONS: { value: QuestionReportReason; label: string }[] = [
  { value: "WRONG_ANSWER", label: "Đáp án sai" },
  { value: "WRONG_OR_MISSING_PROMPT", label: "Đề bài sai hoặc thiếu dữ kiện" },
  { value: "TYPO", label: "Lỗi chính tả / diễn đạt" },
  { value: "BROKEN_FORMULA_OR_IMAGE", label: "Công thức hoặc hình ảnh bị lỗi" },
  { value: "OTHER", label: "Lý do khác" },
];

/** Figma `EduQuiz_BaoLoiCauHoi` (197:2032) — writes directly to IndexedDB `question_reports` */
export default function ReportErrorSheet({
  open,
  questionId,
  questionLabel,
  onClose,
}: ReportErrorSheetProps) {
  const { pushToast } = useUI();
  const [reason, setReason] = useState<QuestionReportReason>("WRONG_ANSWER");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!questionId || submitting) return;
    setSubmitting(true);
    try {
      await attemptService.reportQuestionError({
        questionId,
        reason,
        description,
      });
      pushToast({
        title: "Đã gửi báo cáo câu hỏi",
        message: "Cảm ơn bạn đã góp ý! Báo cáo đã được chuyển tới hàng đợi kiểm duyệt Admin.",
      });
      setDescription("");
      setReason("WRONG_ANSWER");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModalOrSheet
      open={open}
      title="Báo lỗi câu hỏi"
      subtitle={questionLabel ?? "Chọn nguyên nhân bạn gặp phải"}
      onClose={onClose}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {REASONS.map((item) => {
          const active = reason === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setReason(item.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: "var(--eq-radius-lg)",
                border: active
                  ? "1.5px solid var(--eq-primary-quiz)"
                  : "1px solid var(--eq-border-user-card)",
                background: active ? "var(--eq-primary-quiz-soft)" : "var(--eq-bg-surface)",
                color: active ? "var(--eq-primary-quiz)" : "var(--eq-text-primary)",
                fontWeight: active ? 600 : 500,
                fontSize: 14,
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 99,
                  border: active ? "5px solid var(--eq-primary-quiz)" : "2px solid #94a3b8",
                  flexShrink: 0,
                }}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        Mô tả chi tiết (không bắt buộc)
      </label>
      <textarea
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ví dụ: Đáp án đúng phải là B thay vì C do..."
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "var(--eq-radius-md)",
          border: "1px solid var(--eq-border-user-card)",
          fontFamily: "inherit",
          fontSize: 14,
          resize: "vertical",
          marginBottom: 18,
        }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="eq-app-btn-secondary" style={{ flex: 1 }} onClick={onClose}>
          Hủy
        </button>
        <button
          type="button"
          className="eq-app-btn-primary"
          style={{ flex: 1, background: "var(--eq-primary-quiz)" }}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Đang gửi..." : "Gửi báo lỗi"}
        </button>
      </div>
    </ResponsiveModalOrSheet>
  );
}
