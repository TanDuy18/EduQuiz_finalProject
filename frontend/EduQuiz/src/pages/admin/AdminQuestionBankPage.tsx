import { Edit3, Search } from "lucide-react";
import { useEffect, useState } from "react";
import ResponsiveModalOrSheet from "../../components/common/ResponsiveModalOrSheet";
import { useUI } from "../../context/UIContext";
import { useDebounce } from "../../hooks/useDebounce";
import { adminService } from "../../services/adminService";
import type { QuestionApprovalStatus, QuestionRecord } from "../../types/quiz";

/**
 * Figma Admin Screens 08–10:
 * Question Bank List, Filter (Subject/Level/Status), and Question Detail & Edit Modal.
 */
export default function AdminQuestionBankPage() {
  const { pushToast } = useUI();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [subjectFilter, setSubjectFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuestionRecord | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void adminService
      .getQuestionBank({
        page: 1,
        size: 60,
        search: debouncedSearch,
        subject: subjectFilter,
        status: statusFilter,
      })
      .then((res) => {
        if (!active) return;
        setQuestions(res.items);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch, subjectFilter, statusFilter, reloadTick]);

  const handleSaveQuestion = async () => {
    if (!editing) return;
    await adminService.updateQuestion(editing.id, editing);
    pushToast({
      title: "Đã cập nhật câu hỏi",
      message: `Mã ${editing.code ?? editing.id} đã được lưu vào ngân hàng câu hỏi.`,
    });
    setEditing(null);
    setReloadTick((t) => t + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
          Ngân hàng câu hỏi
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-admin-muted)" }}>
          Kiểm duyệt nội dung, đáp án đúng, giải thích và trạng thái hiển thị của câu hỏi
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div className="eq-app-search-box" style={{ flex: 1, minWidth: 220, height: 42, boxShadow: "none" }}>
          <Search size={17} color="var(--eq-text-admin-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã câu hỏi hoặc nội dung..."
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)", background: "#fff", fontSize: 13 }}
        >
          {["Tất cả", "Toán", "Vật lý", "Hóa học", "Ngữ văn", "Kinh tế chính trị"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)", background: "#fff", fontSize: 13 }}
        >
          <option value="Tất cả">Tất cả trạng thái</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="HIDDEN">Đang ẩn</option>
        </select>
      </div>

      {/* Question Cards */}
      {loading ? (
        <div className="eq-app-skeleton" style={{ height: 220 }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.map((q) => (
            <article
              key={q.id}
              style={{
                background: "var(--eq-bg-surface)",
                border: "1px solid var(--eq-border-default)",
                borderRadius: "var(--eq-radius-admin-card)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  <span className="eq-app-badge-pill" style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-admin)" }}>
                    {q.code ?? q.id}
                  </span>
                  <span className="eq-app-badge-pill" style={{ background: "#f1f5f9", color: "var(--eq-text-admin-primary)" }}>
                    {q.subjectName} · {q.levelCode}
                  </span>
                  <span
                    className="eq-app-badge-pill"
                    style={{
                      background:
                        q.approvalStatus === "APPROVED"
                          ? "#e7f7ef"
                          : q.approvalStatus === "HIDDEN"
                            ? "var(--eq-status-danger-bg-admin)"
                            : "#fff4db",
                      color:
                        q.approvalStatus === "APPROVED"
                          ? "var(--eq-status-success-admin)"
                          : q.approvalStatus === "HIDDEN"
                            ? "var(--eq-status-danger-admin)"
                            : "var(--eq-status-warning-text)",
                    }}
                  >
                    {q.approvalStatus === "APPROVED" ? "Đã duyệt" : q.approvalStatus === "HIDDEN" ? "Đang ẩn" : "Chờ duyệt"}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--eq-text-admin-primary)", lineHeight: 1.45 }}>
                  {q.content}
                </div>
              </div>

              <button
                type="button"
                className="eq-app-btn-secondary"
                style={{ height: 34, padding: "0 12px", fontSize: 12 }}
                onClick={() => setEditing(q)}
              >
                <Edit3 size={14} />
                <span>Chỉnh sửa</span>
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <ResponsiveModalOrSheet
        open={Boolean(editing)}
        title="Chỉnh sửa câu hỏi"
        subtitle={editing?.code ?? editing?.id}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                htmlFor="eq-admin-q-content"
                style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--eq-text-admin-primary)" }}
              >
                Nội dung câu hỏi
              </label>
              <textarea
                id="eq-admin-q-content"
                rows={3}
                value={editing.content}
                placeholder="Nhập nội dung câu hỏi..."
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, fontSize: 14, resize: "vertical" }}
              />
            </div>

            <div>
              <label
                htmlFor="eq-admin-q-status"
                style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--eq-text-admin-primary)" }}
              >
                Trạng thái kiểm duyệt
              </label>
              <select
                id="eq-admin-q-status"
                value={editing.approvalStatus}
                onChange={(e) => setEditing({ ...editing, approvalStatus: e.target.value as QuestionApprovalStatus })}
                style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 9, fontSize: 14 }}
              >
                <option value="APPROVED">Đã duyệt (Hiển thị)</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="HIDDEN">Ẩn khỏi đề thi</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--eq-text-admin-primary)" }}>
                Đáp án đúng
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {editing.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={opt.isCorrect}
                    className={`eq-app-option-choice ${opt.isCorrect ? "is-correct" : ""}`}
                    onClick={() =>
                      setEditing({
                        ...editing,
                        options: editing.options.map((o) => ({ ...o, isCorrect: o.id === opt.id })),
                      })
                    }
                  >
                    <span>
                      <strong>{opt.label}.</strong> {opt.content}
                    </span>
                    {opt.isCorrect && <span className="eq-app-option-choice-tag">Đáp án đúng</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="eq-admin-q-explanation"
                style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--eq-text-admin-primary)" }}
              >
                Giải thích
              </label>
              <textarea
                id="eq-admin-q-explanation"
                rows={3}
                value={editing.explanation}
                placeholder="Nhập giải thích chi tiết cho đáp án đúng..."
                onChange={(e) => setEditing({ ...editing, explanation: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, fontSize: 14, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button type="button" className="eq-app-btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(null)}>
                Hủy
              </button>
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ flex: 1, background: "var(--eq-primary-admin)" }}
                onClick={() => void handleSaveQuestion()}
              >
                Lưu câu hỏi
              </button>
            </div>
          </div>
        )}
      </ResponsiveModalOrSheet>
    </div>
  );
}
