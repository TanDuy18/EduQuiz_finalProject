import { CheckCircle2, ClipboardPaste, Eye, Play, Plus, Save, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ResponsiveModalOrSheet from "../../components/common/ResponsiveModalOrSheet";
import SegmentedSelector from "../../components/common/SegmentedSelector";
import { useUI } from "../../context/UIContext";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { quizService } from "../../services/quizService";
import type {
  Difficulty,
  EducationLevelCode,
  QuestionOptionRecord,
  QuestionRecord,
  QuizRecord,
  SubjectDto,
} from "../../types/quiz";
import { parseBulkQuestions } from "../../utils/bulkQuestionParser";

interface DraftQuestion {
  tempId: string;
  content: string;
  explanation: string;
  difficulty: Exclude<Difficulty, "MIXED">;
  options: { label: "A" | "B" | "C" | "D"; content: string; isCorrect: boolean }[];
}

const LABELS: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

const SAMPLE_BULK_TEXT = `Câu 1. Đạo hàm của hàm số y = x² + 3x là?
A. x + 3
*B. 2x + 3
C. 2x² + 3
D. x² + 3

Câu 2. Giá trị của log₂(8) bằng bao nhiêu?
A. 2
B. 4
*C. 3
D. 8`;

function createEmptyQuestion(difficulty: Exclude<Difficulty, "MIXED"> = "MEDIUM"): DraftQuestion {
  return {
    tempId: `dq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    content: "",
    explanation: "",
    difficulty,
    options: LABELS.map((label, idx) => ({
      label,
      content: "",
      isCorrect: idx === 0,
    })),
  };
}

/**
 * Unified Multi-Step Quiz Creator
 * Covers Figma `EduQuiz_TaoQuiz` (262:871), `EduQuiz_SoanCauHoi` (281:1697),
 * `EduQuiz_DanNhieuCau` (281:1782), `EduQuiz_XemTruoc` (289:1988), and `EduQuiz_SanSang` (287:1914).
 */
export default function CreateQuizPage() {
  const [searchParams] = useSearchParams();
  const editQuizId = searchParams.get("edit");
  const { selectedLevel } = useUserPreferences();
  const { pushToast } = useUI();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedQuiz, setSavedQuiz] = useState<QuizRecord | null>(null);

  // Step 1 config state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("sub_math");
  const [levelCode, setLevelCode] = useState<EducationLevelCode>(selectedLevel);
  const [topicTag, setTopicTag] = useState("");
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");

  // Step 2 editor state
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => [createEmptyQuestion("MEDIUM")]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRaw, setBulkRaw] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void quizService.getSubjects().then((list) => {
      if (active) setSubjects(list);
    });
    return () => {
      active = false;
    };
  }, []);

  // Load existing quiz when editing (?edit=<quizId>)
  useEffect(() => {
    if (!editQuizId) return;
    let active = true;
    void Promise.all([
      quizService.getQuizById(editQuizId),
      quizService.getQuestionsForEditor(editQuizId),
    ]).then(([q, qs]) => {
      if (!active || !q) return;
      setTitle(q.title);
      setDescription(q.description);
      setSubjectId(q.subjectId);
      setLevelCode(q.levelCode);
      setTopicTag(q.topicTag ?? "");
      setTargetQuestionCount(q.questionCount);
      setDurationMinutes(q.durationMinutes);
      setDifficulty(q.difficulty);
      if (qs.length > 0) {
        setQuestions(
          qs.map((item) => ({
            tempId: item.id,
            content: item.content,
            explanation: item.explanation,
            difficulty: item.difficulty,
            options: LABELS.map((lbl, idx) => {
              const found = item.options.find((o) => o.label === lbl) ?? item.options[idx];
              return {
                label: lbl,
                content: found?.content ?? "",
                isCorrect: Boolean(found?.isCorrect),
              };
            }),
          })),
        );
      }
    });
    return () => {
      active = false;
    };
  }, [editQuizId]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) ?? subjects[0],
    [subjects, subjectId],
  );

  const parsedBulk = useMemo(() => parseBulkQuestions(bulkRaw), [bulkRaw]);
  const validBulkQuestions = useMemo(
    () => parsedBulk.filter((q) => q.errors.length === 0),
    [parsedBulk],
  );

  const updateQuestion = (tempId: string, updater: (q: DraftQuestion) => DraftQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.tempId === tempId ? updater(q) : q)));
  };

  const handleImportBulk = () => {
    if (validBulkQuestions.length === 0) return;
    const defaultDiff: Exclude<Difficulty, "MIXED"> =
      difficulty === "MIXED" ? "MEDIUM" : difficulty;

    const imported: DraftQuestion[] = validBulkQuestions.map((pq) => ({
      tempId: `bulk_${Date.now()}_${pq.index}_${Math.random().toString(36).slice(2, 5)}`,
      content: pq.content,
      explanation: "",
      difficulty: defaultDiff,
      options: LABELS.map((lbl) => {
        const match = pq.options.find((o) => o.label === lbl);
        return {
          label: lbl,
          content: match?.content ?? "",
          isCorrect: Boolean(match?.isCorrect),
        };
      }),
    }));

    setQuestions((prev) => {
      const onlyBlankFirst =
        prev.length === 1 && !prev[0].content.trim() && prev[0].options.every((o) => !o.content.trim());
      return onlyBlankFirst ? imported : [...prev, ...imported];
    });
    setBulkRaw("");
    setBulkOpen(false);
    pushToast({
      title: `Đã nhập ${imported.length} câu hỏi`,
      message: "Bạn có thể chỉnh sửa thêm hoặc bấm Xuất bản đề ngay.",
    });
  };

  const handlePersist = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      pushToast({ title: "Thiếu tiêu đề đề thi", message: "Vui lòng nhập tên đề thi trước khi lưu." });
      setStep(1);
      return;
    }

    const cleanedQuestions: Omit<QuestionRecord, "id" | "quizId" | "dataSource">[] = questions
      .filter((q) => q.content.trim().length > 0)
      .map((q, idx) => {
        const validOptions: QuestionOptionRecord[] = q.options
          .filter((o) => o.content.trim().length > 0)
          .map((o, optIdx) => ({
            id: `opt_${idx}_${optIdx}`,
            label: o.label,
            content: o.content.trim(),
            isCorrect: o.isCorrect,
            orderIndex: optIdx + 1,
          }));

        if (validOptions.length > 0 && !validOptions.some((o) => o.isCorrect)) {
          validOptions[0].isCorrect = true;
        }

        return {
          subjectName: selectedSubject?.name ?? "Toán",
          levelCode,
          content: q.content.trim(),
          type: "SINGLE_CHOICE",
          difficulty: q.difficulty,
          explanation: q.explanation.trim() || "Đáp án đúng đã được tác giả xác nhận.",
          score: 1,
          orderIndex: idx + 1,
          approvalStatus: "APPROVED",
          options: validOptions,
        };
      });

    if (status === "PUBLISHED") {
      if (cleanedQuestions.length === 0) {
        pushToast({
          title: "Chưa có câu hỏi hợp lệ",
          message: "Hãy nhập ít nhất 1 câu hỏi có nội dung và đáp án trước khi xuất bản.",
        });
        return;
      }
      const hasInvalid = cleanedQuestions.some((q) => q.options.length < 2);
      if (hasInvalid) {
        pushToast({
          title: "Câu hỏi chưa đủ đáp án",
          message: "Mỗi câu hỏi cần ít nhất 2 lựa chọn (A, B...).",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        subjectId: selectedSubject?.id ?? subjectId,
        subjectName: selectedSubject?.name ?? "Toán",
        levelCode,
        topicTag: topicTag.trim() || undefined,
        targetQuestionCount: cleanedQuestions.length || targetQuestionCount,
        durationMinutes,
        difficulty,
        quizStatus: status,
        questions: cleanedQuestions,
      };

      const result = editQuizId
        ? await quizService.updateQuiz(editQuizId, payload)
        : await quizService.createQuiz(payload);

      setSavedQuiz(result);
      setStep(3);
      pushToast({
        title: status === "PUBLISHED" ? "Xuất bản đề thành công" : "Đã lưu bản nháp",
        message: `"${result.title}" đã được lưu vào Đề của tôi.`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header + Stepper */}
      <div
        className="eq-app-user-card"
        style={{
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: 22 }}>
            {editQuizId ? "Chỉnh sửa bộ đề" : "Tạo Quiz mới"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-muted)" }}>
            Tạo bộ đề trắc nghiệm cá nhân hoặc dán hàng loạt câu hỏi chỉ trong vài giây
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[
            { num: 1 as const, label: "1. Cấu hình" },
            { num: 2 as const, label: "2. Soạn câu hỏi" },
            { num: 3 as const, label: "3. Hoàn tất" },
          ].map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                disabled={s.num === 3 && !savedQuiz}
                onClick={() => {
                  if (s.num !== 3 || savedQuiz) setStep(s.num);
                }}
                style={{
                  border: "none",
                  borderRadius: "var(--eq-radius-full)",
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  background: active
                    ? "var(--eq-primary-action)"
                    : done
                      ? "var(--eq-status-success-bg)"
                      : "var(--eq-bg-user-surface-subtle)",
                  color: active
                    ? "#fff"
                    : done
                      ? "var(--eq-status-success-text)"
                      : "var(--eq-text-muted)",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Quiz Configuration (Figma 262:871) */}
      {step === 1 && (
        <section className="eq-app-user-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
              Tên bộ đề *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Ôn tập Toán 12 - Nguyên hàm & Tích phân"
              style={{
                width: "100%",
                height: 44,
                padding: "0 14px",
                borderRadius: "var(--eq-radius-md)",
                border: "1px solid var(--eq-border-user-card)",
                fontSize: 15,
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                Môn học
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  borderRadius: "var(--eq-radius-md)",
                  border: "1px solid var(--eq-border-user-card)",
                  fontSize: 14,
                  background: "#fff",
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                Cấp học
              </label>
              <SegmentedSelector
                ariaLabel="Chọn cấp học"
                options={[
                  { label: "THCS", value: "THCS" as EducationLevelCode },
                  { label: "THPT", value: "THPT" as EducationLevelCode },
                  { label: "Đại học", value: "UNIVERSITY" as EducationLevelCode },
                ]}
                value={levelCode}
                onChange={setLevelCode}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                Số câu dự kiến
              </label>
              <SegmentedSelector
                ariaLabel="Số câu hỏi"
                options={[
                  { label: "5 câu", value: 5 },
                  { label: "10 câu", value: 10 },
                  { label: "20 câu", value: 20 },
                  { label: "40 câu", value: 40 },
                ]}
                value={targetQuestionCount}
                onChange={setTargetQuestionCount}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                Độ khó
              </label>
              <SegmentedSelector
                ariaLabel="Độ khó"
                options={[
                  { label: "Dễ", value: "EASY" as Difficulty },
                  { label: "Vừa", value: "MEDIUM" as Difficulty },
                  { label: "Khó", value: "HARD" as Difficulty },
                  { label: "Trộn", value: "MIXED" as Difficulty },
                ]}
                value={difficulty}
                onChange={setDifficulty}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                Thời gian làm bài (phút)
              </label>
              <SegmentedSelector
                ariaLabel="Thời gian"
                options={[
                  { label: "15p", value: 15 },
                  { label: "30p", value: 30 },
                  { label: "45p", value: 45 },
                  { label: "60p", value: 60 },
                  { label: "90p", value: 90 },
                ]}
                value={durationMinutes}
                onChange={setDurationMinutes}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                Chuyên đề / Tag (tuỳ chọn)
              </label>
              <input
                type="text"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                placeholder="Ví dụ: Giải tích, Chương 2..."
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 14px",
                  borderRadius: "var(--eq-radius-md)",
                  border: "1px solid var(--eq-border-user-card)",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
              Mô tả ngắn
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú phạm vi kiến thức hoặc lưu ý làm bài..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--eq-radius-md)",
                border: "1px solid var(--eq-border-user-card)",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6 }}>
            <Link to="/my-quizzes" className="eq-app-btn-secondary" style={{ textDecoration: "none" }}>
              Đề của tôi
            </Link>
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ background: "var(--eq-primary-action)" }}
              onClick={() => {
                if (!title.trim()) {
                  pushToast({ title: "Nhập tên bộ đề", message: "Hãy đặt tên cho đề thi trước khi sang bước soạn câu hỏi." });
                  return;
                }
                setStep(2);
              }}
            >
              Tiếp tục soạn câu hỏi
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: Manual Question Editor + Bulk Paste Trigger (Figma 281:1697 & 281:1782) */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            className="eq-app-user-card"
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Đang soạn <strong>{questions.length}</strong> câu hỏi cho{" "}
              <span style={{ color: "var(--eq-primary-action)" }}>{title}</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="eq-app-btn-secondary"
                style={{ height: 38, padding: "0 12px", fontSize: 13 }}
                onClick={() => setBulkOpen(true)}
              >
                <ClipboardPaste size={15} />
                <span>Dán nhiều câu</span>
              </button>

              <button
                type="button"
                className="eq-app-btn-secondary"
                style={{ height: 38, padding: "0 12px", fontSize: 13 }}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye size={15} />
                <span>Xem trước</span>
              </button>
            </div>
          </div>

          {questions.map((q, qIdx) => (
            <article key={q.tempId} className="eq-app-user-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span
                  className="eq-app-badge-pill"
                  style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-action)" }}
                >
                  Câu {qIdx + 1}
                </span>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setQuestions((prev) => prev.filter((item) => item.tempId !== q.tempId))}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: "none",
                      background: "transparent",
                      color: "var(--eq-status-danger-border)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Xóa câu</span>
                  </button>
                )}
              </div>

              <textarea
                rows={2}
                value={q.content}
                onChange={(e) =>
                  updateQuestion(q.tempId, (prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Nhập nội dung câu hỏi..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "var(--eq-radius-md)",
                  border: "1px solid var(--eq-border-user-card)",
                  fontFamily: "inherit",
                  fontSize: 15,
                  marginBottom: 14,
                }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, marginBottom: 12 }}>
                {q.options.map((opt) => (
                  <div
                    key={opt.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: "var(--eq-radius-md)",
                      border: opt.isCorrect
                        ? "1.5px solid var(--eq-status-success-border)"
                        : "1px solid var(--eq-border-user-card)",
                      background: opt.isCorrect ? "var(--eq-status-success-bg)" : "var(--eq-bg-user-surface-subtle)",
                    }}
                  >
                    <button
                      type="button"
                      title="Đánh dấu đáp án đúng"
                      onClick={() =>
                        updateQuestion(q.tempId, (prev) => ({
                          ...prev,
                          options: prev.options.map((o) => ({ ...o, isCorrect: o.label === opt.label })),
                        }))
                      }
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 99,
                        border: "none",
                        background: opt.isCorrect ? "var(--eq-status-success-border)" : "#cbd5e1",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {opt.label}
                    </button>
                    <input
                      type="text"
                      value={opt.content}
                      onChange={(e) =>
                        updateQuestion(q.tempId, (prev) => ({
                          ...prev,
                          options: prev.options.map((o) =>
                            o.label === opt.label ? { ...o, content: e.target.value } : o,
                          ),
                        }))
                      }
                      placeholder={`Đáp án ${opt.label}...`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: 14,
                      }}
                    />
                  </div>
                ))}
              </div>

              <input
                type="text"
                value={q.explanation}
                onChange={(e) =>
                  updateQuestion(q.tempId, (prev) => ({ ...prev, explanation: e.target.value }))
                }
                placeholder="Giải thích đáp án (tuỳ chọn)..."
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: "var(--eq-radius-md)",
                  border: "1px dashed var(--eq-border-user-card)",
                  fontSize: 13,
                  background: "var(--eq-bg-surface)",
                }}
              />
            </article>
          ))}

          {/* Add Question + Action Footer */}
          <div
            className="eq-app-user-card"
            style={{
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="eq-app-btn-secondary"
              onClick={() =>
                setQuestions((prev) => [
                  ...prev,
                  createEmptyQuestion(difficulty === "MIXED" ? "MEDIUM" : difficulty),
                ])
              }
            >
              <Plus size={17} />
              <span>Thêm câu hỏi</span>
            </button>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="eq-app-btn-secondary"
                disabled={saving}
                onClick={() => void handlePersist("DRAFT")}
              >
                <Save size={16} />
                <span>Lưu bản nháp</span>
              </button>

              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ background: "var(--eq-primary-action)" }}
                disabled={saving}
                onClick={() => void handlePersist("PUBLISHED")}
              >
                <Send size={16} />
                <span>{saving ? "Đang lưu..." : "Xuất bản đề"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Quiz Ready (Figma 287:1914) */}
      {step === 3 && savedQuiz && (
        <section className="eq-app-user-card" style={{ padding: "36px 24px", textAlign: "center" }}>
          <CheckCircle2 size={54} color="var(--eq-status-success-border)" style={{ marginBottom: 12 }} />
          <h2 style={{ margin: "0 0 8px", fontFamily: "var(--eq-font-heading)", fontSize: 24 }}>
            {savedQuiz.quizStatus === "PUBLISHED" ? "Đề thi của bạn đã sẵn sàng!" : "Đã lưu bản nháp thành công!"}
          </h2>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--eq-text-muted)" }}>
            <strong>{savedQuiz.title}</strong> · {savedQuiz.subjectName} · {savedQuiz.questionCount} câu ·{" "}
            {savedQuiz.durationMinutes} phút
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ background: "var(--eq-primary-quiz)" }}
              onClick={() => navigate(`/quiz/${savedQuiz.id}`)}
            >
              <Play size={17} fill="currentColor" />
              <span>Làm thử ngay</span>
            </button>

            <Link
              to={`/exams/detail/${savedQuiz.id}`}
              className="eq-app-btn-secondary"
              style={{ textDecoration: "none" }}
            >
              Xem trang chi tiết
            </Link>

            <Link to="/my-quizzes" className="eq-app-btn-secondary" style={{ textDecoration: "none" }}>
              Về Đề của tôi
            </Link>
          </div>
        </section>
      )}

      {/* Bulk Paste Modal (Figma 281:1782) */}
      <ResponsiveModalOrSheet
        open={bulkOpen}
        title="Dán nhiều câu hỏi"
        subtitle="Đánh dấu đáp án đúng bằng dấu * ở đầu hoặc cuối (ví dụ: *B. 2x)"
        onClose={() => setBulkOpen(false)}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setBulkRaw(SAMPLE_BULK_TEXT)}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--eq-primary-action)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Chèn mẫu thử (2 câu)
          </button>
        </div>

        <textarea
          rows={8}
          value={bulkRaw}
          onChange={(e) => setBulkRaw(e.target.value)}
          placeholder={SAMPLE_BULK_TEXT}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: "var(--eq-radius-md)",
            border: "1px solid var(--eq-border-user-card)",
            fontFamily: "monospace",
            fontSize: 13,
            marginBottom: 12,
          }}
        />

        {parsedBulk.length > 0 && (
          <div
            style={{
              maxHeight: 170,
              overflowY: "auto",
              background: "var(--eq-bg-user-surface-subtle)",
              border: "1px solid var(--eq-border-user-card)",
              borderRadius: "var(--eq-radius-md)",
              padding: 10,
              marginBottom: 14,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Nhận diện {parsedBulk.length} câu ({validBulkQuestions.length} hợp lệ):
            </div>
            {parsedBulk.map((item) => (
              <div
                key={item.index}
                style={{
                  padding: "6px 0",
                  borderTop: "1px solid var(--eq-border-user-card)",
                  color: item.errors.length > 0 ? "var(--eq-status-danger-text)" : "var(--eq-status-success-text)",
                }}
              >
                <strong>Câu {item.index}:</strong> {item.content || "(trống)"}
                {item.errors.length > 0 ? ` — Lỗi: ${item.errors.join("; ")}` : ` — OK (${item.options.length} đáp án)`}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="eq-app-btn-secondary" style={{ flex: 1 }} onClick={() => setBulkOpen(false)}>
            Hủy
          </button>
          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ flex: 1, background: "var(--eq-primary-action)" }}
            disabled={validBulkQuestions.length === 0}
            onClick={handleImportBulk}
          >
            Nhập {validBulkQuestions.length} câu hợp lệ
          </button>
        </div>
      </ResponsiveModalOrSheet>

      {/* Live Preview Modal (Figma 289:1988) */}
      <ResponsiveModalOrSheet
        open={previewOpen}
        title={title || "Xem trước bộ đề"}
        subtitle={`${selectedSubject?.name ?? "Toán"} · ${questions.length} câu · ${durationMinutes} phút`}
        onClose={() => setPreviewOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {questions.map((q, idx) => (
            <div
              key={q.tempId}
              style={{
                padding: 12,
                borderRadius: "var(--eq-radius-md)",
                background: "var(--eq-bg-user-surface-subtle)",
                border: "1px solid var(--eq-border-user-card)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                Câu {idx + 1}: {q.content || "(Chưa nhập nội dung)"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                {q.options
                  .filter((o) => o.content.trim())
                  .map((o) => (
                    <div
                      key={o.label}
                      style={{
                        color: o.isCorrect ? "var(--eq-status-success-text)" : "var(--eq-text-secondary)",
                        fontWeight: o.isCorrect ? 700 : 400,
                      }}
                    >
                      {o.label}. {o.content} {o.isCorrect ? "(Đúng)" : ""}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </ResponsiveModalOrSheet>
    </div>
  );
}
