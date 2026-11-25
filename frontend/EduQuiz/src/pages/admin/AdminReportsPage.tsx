import { CheckCircle2, Search, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import ResponsiveModalOrSheet from "../../components/common/ResponsiveModalOrSheet";
import { useUI } from "../../context/UIContext";
import { useDebounce } from "../../hooks/useDebounce";
import { adminService } from "../../services/adminService";
import type { QuestionReportRecord } from "../../types/attempt";

/**
 * Figma Admin Screens 11–13 (`444:768` Android Reports Queue & Resolution):
 * Live synced with student error reports submitted from Phase 4 (`question_reports` store).
 */
export default function AdminReportsPage() {
  const { pushToast } = useUI();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [reports, setReports] = useState<QuestionReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  const [selected, setSelected] = useState<QuestionReportRecord | null>(null);
  const [action, setAction] = useState<"EDIT_QUESTION" | "KEEP_QUESTION" | "HIDE_QUESTION">("EDIT_QUESTION");
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    void adminService
      .getQuestionReports({
        page: 1,
        size: 50,
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
      })
      .then((res) => {
        if (!active) return;
        setReports(res.items);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch, statusFilter, priorityFilter, reloadTick]);

  const handleResolve = async (finalStatus: "RESOLVED" | "DISMISSED") => {
    if (!selected) return;
    await adminService.resolveQuestionReport(selected.id, {
      action,
      note: note.trim() || (finalStatus === "RESOLVED" ? "Đã kiểm tra và cập nhật câu hỏi." : "Báo cáo không hợp lệ."),
      status: finalStatus,
    });
    pushToast({
      title: finalStatus === "RESOLVED" ? "Đã xử lý báo cáo" : "Đã từ chối báo cáo",
      message:
        action === "HIDE_QUESTION"
          ? `Báo cáo ${selected.id} hoàn tất và đã ẩn câu hỏi ${selected.questionCode}.`
          : `Báo cáo ${selected.id} đã được cập nhật trạng thái.`,
    });
    setSelected(null);
    setNote("");
    setReloadTick((t) => t + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
          Báo cáo câu hỏi sai
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-admin-muted)" }}>
          Đồng bộ trực tiếp với các báo lỗi do học viên gửi từ phòng thi (IndexedDB `question_reports`)
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
            placeholder="Tìm mã báo cáo, mã câu hỏi, môn học..."
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)", background: "#fff", fontSize: 13 }}
        >
          <option value="ALL">Mọi mức ưu tiên</option>
          <option value="HIGH">Ưu tiên cao</option>
          <option value="NORMAL">Thông thường</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)", background: "#fff", fontSize: 13 }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xử lý</option>
          <option value="REVIEWING">Đang kiểm tra</option>
          <option value="RESOLVED">Đã giải quyết</option>
          <option value="DISMISSED">Từ chối</option>
        </select>
      </div>

      {/* Report List */}
      {loading ? (
        <div className="eq-app-skeleton" style={{ height: 220 }} />
      ) : reports.length === 0 ? (
        <div
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-admin-card)",
            padding: 32,
            textAlign: "center",
            color: "var(--eq-text-admin-muted)",
          }}
        >
          Không có báo cáo nào phù hợp bộ lọc.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reports.map((r) => (
            <article
              key={r.id}
              style={{
                background: "var(--eq-bg-surface)",
                border: "1px solid var(--eq-border-default)",
                borderRadius: "var(--eq-radius-admin-card)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  <span className="eq-app-badge-pill" style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-admin)" }}>
                    {r.id} · {r.questionCode}
                  </span>
                  {r.priority === "HIGH" && (
                    <span className="eq-app-badge-pill" style={{ background: "var(--eq-status-danger-bg-admin)", color: "var(--eq-status-danger-admin)" }}>
                      Ưu tiên
                    </span>
                  )}
                  <span
                    className="eq-app-badge-pill"
                    style={{
                      background:
                        r.status === "RESOLVED"
                          ? "#e7f7ef"
                          : r.status === "DISMISSED"
                            ? "#f1f5f9"
                            : "#fff4db",
                      color:
                        r.status === "RESOLVED"
                          ? "var(--eq-status-success-admin)"
                          : r.status === "DISMISSED"
                            ? "var(--eq-text-admin-muted)"
                            : "var(--eq-status-warning-text)",
                    }}
                  >
                    {r.status === "PENDING"
                      ? "Chờ xử lý"
                      : r.status === "REVIEWING"
                        ? "Đang kiểm tra"
                        : r.status === "RESOLVED"
                          ? "Đã giải quyết"
                          : "Đã bỏ qua"}
                  </span>
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--eq-text-admin-primary)", marginBottom: 4 }}>
                  {r.reasonLabel} — {r.subjectName} ({r.levelCode})
                </div>
                <div style={{ fontSize: 13, color: "var(--eq-text-secondary)", marginBottom: 4 }}>
                  {r.questionPreview}
                </div>
                <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)" }}>
                  Người báo: {r.reporterName} · {r.createdAt} · Ghi chú: {r.description}
                </div>
              </div>

              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ height: 34, padding: "0 14px", fontSize: 12, background: "var(--eq-primary-admin)" }}
                onClick={() => {
                  setSelected(r);
                  setNote(r.resolutionNote ?? "");
                  setAction(r.resolutionAction ?? "EDIT_QUESTION");
                }}
              >
                <ShieldAlert size={14} />
                <span>Xử lý</span>
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      <ResponsiveModalOrSheet
        open={Boolean(selected)}
        title={`Xử lý báo cáo ${selected?.id ?? ""}`}
        subtitle={selected ? `${selected.questionCode} · ${selected.reasonLabel}` : undefined}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--eq-bg-admin-android)", fontSize: 13 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{selected.questionPreview}</div>
              <div style={{ color: "var(--eq-text-admin-muted)" }}>Chi tiết từ học viên: {selected.description}</div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Phương án xử lý</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(
                  [
                    { val: "EDIT_QUESTION", label: "Sửa nội dung / đáp án câu hỏi" },
                    { val: "KEEP_QUESTION", label: "Giữ nguyên câu hỏi (đáp án đã chính xác)" },
                    { val: "HIDE_QUESTION", label: "Ẩn câu hỏi khỏi ngân hàng đề ngay lập tức" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setAction(opt.val)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: action === opt.val ? "1.5px solid var(--eq-primary-admin)" : "1px solid var(--eq-border-default)",
                      background: action === opt.val ? "var(--eq-bg-surface-soft)" : "#fff",
                      fontSize: 13,
                      fontWeight: action === opt.val ? 700 : 500,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Ghi chú kiểm duyệt</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập kết quả kiểm tra để lưu lịch sử..."
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--eq-border-default)", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="eq-app-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => void handleResolve("DISMISSED")}
              >
                Bỏ qua báo cáo
              </button>
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ flex: 1, background: "var(--eq-status-success-admin)" }}
                onClick={() => void handleResolve("RESOLVED")}
              >
                <CheckCircle2 size={16} />
                <span>Đánh dấu đã xử lý</span>
              </button>
            </div>
          </div>
        )}
      </ResponsiveModalOrSheet>
    </div>
  );
}
