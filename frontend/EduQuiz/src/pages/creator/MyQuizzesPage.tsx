import { Bookmark, Edit3, Play, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveModalOrSheet from "../../components/common/ResponsiveModalOrSheet";
import { useUI } from "../../context/UIContext";
import { useDebounce } from "../../hooks/useDebounce";
import { quizService } from "../../services/quizService";
import type { QuizRecord } from "../../types/quiz";

type MyQuizTab = "ALL" | "PUBLISHED" | "DRAFT" | "SAVED";

/** Figma `EduQuiz_DeCuaToi` (295:2128) — Personal Quizzes & Saved Bookmarks */
export default function MyQuizzesPage() {
  const navigate = useNavigate();
  const { pushToast } = useUI();

  const [tab, setTab] = useState<MyQuizTab>("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [items, setItems] = useState<QuizRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<QuizRecord | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const request =
      tab === "SAVED"
        ? quizService.getQuizzes({ page: 1, size: 50, onlySaved: true, search: debouncedSearch })
        : quizService.getQuizzes({
            page: 1,
            size: 50,
            onlyMine: true,
            quizStatus: tab === "ALL" ? undefined : tab,
            search: debouncedSearch,
          });

    void request.then((res) => {
      if (!active) return;
      setItems(res.items);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [tab, debouncedSearch, reloadTick]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await quizService.deleteQuiz(deleteTarget.id);
    pushToast({
      title: "Đã xóa bộ đề",
      message: `"${deleteTarget.title}" đã được xóa khỏi danh sách của bạn.`,
    });
    setDeleteTarget(null);
    setReloadTick((t) => t + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: "var(--eq-text-screen-title)" }}>
            Đề của tôi
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--eq-text-muted)" }}>
            Quản lý các bộ đề bạn tự soạn, bản nháp và đề đã lưu
          </p>
        </div>

        <button
          type="button"
          className="eq-app-btn-primary"
          style={{ background: "var(--eq-primary-create)", borderRadius: "var(--eq-radius-cta)" }}
          onClick={() => navigate("/create-quiz")}
        >
          <Plus size={18} />
          <span>Tạo Quiz mới</span>
        </button>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(
            [
              { key: "ALL", label: "Tất cả đề tự tạo" },
              { key: "PUBLISHED", label: "Đã xuất bản" },
              { key: "DRAFT", label: "Bản nháp" },
              { key: "SAVED", label: "Đề đã lưu" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                border: tab === t.key ? "none" : "1px solid var(--eq-border-user-card)",
                borderRadius: "var(--eq-radius-full)",
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                background: tab === t.key ? "var(--eq-primary-admin)" : "var(--eq-bg-surface)",
                color: tab === t.key ? "#fff" : "var(--eq-text-secondary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="eq-app-search-box" style={{ width: "min(320px, 100%)", height: 42 }}>
          <Search size={17} color="var(--eq-text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm trong danh sách..."
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="eq-app-exams-grid">
          <div className="eq-app-skeleton" style={{ height: 140 }} />
          <div className="eq-app-skeleton" style={{ height: 140 }} />
        </div>
      ) : items.length === 0 ? (
        <div className="eq-app-user-card" style={{ padding: "40px 24px", textAlign: "center" }}>
          <h3 style={{ margin: "0 0 8px" }}>Chưa có bộ đề nào trong mục này</h3>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--eq-text-muted)" }}>
            {tab === "SAVED"
              ? "Bấm nút Lưu đề ở trang Chi tiết đề thi để xem lại tại đây."
              : "Bắt đầu tạo bộ đề đầu tiên bằng trình soạn câu hỏi hoặc dán văn bản hàng loạt."}
          </p>
          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ background: "var(--eq-primary-action)" }}
            onClick={() => navigate(tab === "SAVED" ? "/exam" : "/create-quiz")}
          >
            {tab === "SAVED" ? "Khám phá Đề thi" : "Tạo Quiz ngay"}
          </button>
        </div>
      ) : (
        <div className="eq-app-exams-grid">
          {items.map((quiz) => {
            const isMine = quiz.createdBy === "current_user";
            const isDraft = quiz.quizStatus === "DRAFT";
            return (
              <article
                key={quiz.id}
                className="eq-app-user-card"
                style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span
                        className="eq-app-badge-pill"
                        style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-action)" }}
                      >
                        {quiz.subjectName}
                      </span>
                      <span
                        className="eq-app-badge-pill"
                        style={{
                          background: isDraft ? "#fff4db" : "var(--eq-status-success-bg)",
                          color: isDraft ? "var(--eq-status-warning-text)" : "var(--eq-status-success-text)",
                        }}
                      >
                        {isDraft ? "Bản nháp" : "Đã xuất bản"}
                      </span>
                    </div>

                    {quiz.isSaved && <Bookmark size={16} color="var(--eq-primary-admin)" fill="currentColor" />}
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontFamily: "var(--eq-font-heading)", fontSize: 17 }}>
                    {quiz.title}
                  </h3>
                  <div style={{ fontSize: 13, color: "var(--eq-text-muted)" }}>
                    {quiz.questionCount} câu · {quiz.durationMinutes} phút · {quiz.difficultyLabel}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid var(--eq-border-user-card)" }}>
                  <button
                    type="button"
                    className="eq-app-btn-primary"
                    style={{ height: 36, padding: "0 14px", fontSize: 13, background: "var(--eq-primary-quiz)", flex: 1 }}
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Làm bài</span>
                  </button>

                  {isMine && (
                    <>
                      <button
                        type="button"
                        className="eq-app-btn-secondary"
                        style={{ height: 36, padding: "0 12px", fontSize: 13 }}
                        onClick={() => navigate(`/create-quiz?edit=${quiz.id}`)}
                      >
                        <Edit3 size={14} />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        className="eq-app-btn-secondary"
                        style={{ height: 36, padding: "0 10px", color: "var(--eq-status-danger-border)" }}
                        aria-label="Xóa bộ đề"
                        onClick={() => setDeleteTarget(quiz)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ResponsiveModalOrSheet
        open={Boolean(deleteTarget)}
        title="Xóa bộ đề này?"
        subtitle={deleteTarget?.title}
        onClose={() => setDeleteTarget(null)}
      >
        <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--eq-text-secondary)" }}>
          Toàn bộ câu hỏi thuộc bộ đề này sẽ bị xóa khỏi IndexedDB trình duyệt và không thể hoàn tác.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="eq-app-btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>
            Hủy
          </button>
          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ flex: 1, background: "var(--eq-status-danger-border)" }}
            onClick={() => void handleDelete()}
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </ResponsiveModalOrSheet>
    </div>
  );
}
