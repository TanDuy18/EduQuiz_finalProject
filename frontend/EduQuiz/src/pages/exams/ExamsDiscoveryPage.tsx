import { Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import iconFilterSettings from "../../assets/figma/icon-filter-settings.png";
import SegmentedSelector from "../../components/common/SegmentedSelector";
import SubjectChip from "../../components/common/SubjectChip";
import ExamCard from "../../components/exam/ExamCard";
import ExamFilterSheet, { type ExamFilterState } from "../../components/exam/ExamFilterSheet";
import SubjectPickerModal from "../../components/exam/SubjectPickerModal";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { useDebounce } from "../../hooks/useDebounce";
import { attemptService } from "../../services/attemptService";
import { quizService } from "../../services/quizService";
import type { AttemptRecord } from "../../types/attempt";
import type { Difficulty, QuizRecord, SubjectDto } from "../../types/quiz";

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Dễ", value: "EASY" },
  { label: "Vừa", value: "MEDIUM" },
  { label: "Khó", value: "HARD" },
];

/**
 * Unified Responsive Exam Discovery
 * Covers Figma `iPhone Air 14` (167:176), `EduQuiz_Toan/VatLy/HoaHoc/NguVan` (189:631..966),
 * and `EduQuiz_KetQuaLoc` (324:3768).
 */
export default function ExamsDiscoveryPage() {
  const { subjectId: routeSubjectId } = useParams<{ subjectId?: string }>();
  const [searchParams] = useSearchParams();
  const { selectedLevel } = useUserPreferences();
  const navigate = useNavigate();

  const initialSubject = routeSubjectId || searchParams.get("subject");
  const initialPopular = searchParams.get("popular") === "true";

  const [allSubjects, setAllSubjects] = useState<SubjectDto[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [inProgress, setInProgress] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [filter, setFilter] = useState<ExamFilterState>(() => ({
    subjectIds: initialSubject ? [initialSubject] : [],
    examType: initialPopular ? "POPULAR" : "ALL",
    difficulty: "ALL",
  }));

  const [filterOpen, setFilterOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Sync URL subject change when navigating from Home categories
  useEffect(() => {
    const paramSub = routeSubjectId || searchParams.get("subject");
    if (paramSub) {
      setFilter((prev) => ({ ...prev, subjectIds: [paramSub] }));
    }
  }, [routeSubjectId, searchParams]);

  useEffect(() => {
    let active = true;
    void quizService.getSubjects().then((list) => {
      if (active) setAllSubjects(list);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const onlyPopular = filter.examType === "POPULAR" ? true : undefined;
    const topicTag =
      filter.examType === "MOCK"
        ? "Đề thi thử"
        : filter.examType === "TOPIC"
          ? "Chuyên đề"
          : undefined;

    void Promise.all([
      quizService.getQuizzes({
        page: 1,
        size: 50,
        search: debouncedSearch,
        levelCode: filter.subjectIds.length === 0 ? selectedLevel : undefined,
        subjectIds: filter.subjectIds.length > 0 ? filter.subjectIds : undefined,
        difficulty: filter.difficulty === "ALL" ? undefined : filter.difficulty,
        onlyPopular,
        topicTag,
      }),
      attemptService.getInProgressAttempts(),
    ]).then(([res, attempts]) => {
      if (!active) return;
      setQuizzes(res.items);
      setInProgress(attempts);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [debouncedSearch, selectedLevel, filter]);

  const progressByQuizId = useMemo(() => {
    const map = new Map<string, number>();
    for (const att of inProgress) {
      const pct = Math.min(100, Math.round((att.answeredCount / Math.max(1, att.totalCount)) * 100));
      map.set(att.quizId, pct);
    }
    return map;
  }, [inProgress]);

  const quickSubjects = useMemo(() => {
    if (selectedLevel === "UNIVERSITY") {
      return allSubjects.filter(
        (s) => s.levelCode === "UNIVERSITY" || s.id === "sub_chemistry" || s.id === "sub_physics",
      ).slice(0, 6);
    }
    return allSubjects.filter((s) => s.levelCode === "THPT").slice(0, 6);
  }, [allSubjects, selectedLevel]);

  const selectedSubjects = useMemo(
    () => allSubjects.filter((s) => filter.subjectIds.includes(s.id)),
    [allSubjects, filter.subjectIds],
  );

  const hasActiveFilters =
    filter.subjectIds.length > 0 ||
    filter.examType !== "ALL" ||
    filter.difficulty !== "ALL" ||
    debouncedSearch.trim().length > 0;

  const pageHeading =
    selectedSubjects.length === 1 ? `Đề thi ${selectedSubjects[0].name}` : "Đề thi";

  const toggleQuickSubject = (id: string) => {
    setFilter((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(id)
        ? prev.subjectIds.filter((x) => x !== id)
        : [id],
    }));
  };

  const resetAllFilters = () => {
    setSearchInput("");
    setFilter({ subjectIds: [], examType: "ALL", difficulty: "ALL" });
  };

  return (
    <div>
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--eq-font-heading)",
              fontSize: "var(--eq-text-screen-title)",
              fontWeight: "var(--eq-weight-extrabold)",
              color: "var(--eq-text-black)",
              lineHeight: 1.2,
            }}
          >
            {pageHeading}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 15, color: "var(--eq-text-body-dark)" }}>
            Chọn đề phù hợp với trình độ {selectedLevel === "UNIVERSITY" ? "Đại học" : selectedLevel}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/my-quizzes"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--eq-primary-link-strong)",
              textDecoration: "none",
            }}
          >
            Đề của tôi
          </Link>

          <button
            type="button"
            className="eq-app-btn-primary"
            style={{
              height: 40,
              padding: "0 16px",
              fontSize: 14,
              background: "var(--eq-primary-create)",
              borderRadius: "var(--eq-radius-cta)",
            }}
            onClick={() => navigate("/create-quiz")}
          >
            <Plus size={17} />
            <span>Tạo Quiz</span>
          </button>
        </div>
      </div>

      {/* Search + Mobile Filter Trigger */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div className="eq-app-search-box" style={{ flex: 1 }}>
          <Search size={19} color="var(--eq-text-muted)" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm đề thi, môn học, chuyên đề..."
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Xóa từ khóa"
              onClick={() => setSearchInput("")}
              style={{ border: "none", background: "transparent", color: "var(--eq-text-muted)", padding: 4 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label="Mở bộ lọc"
          onClick={() => setFilterOpen(true)}
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--eq-radius-sm)",
            border: "1px solid var(--eq-border-user-card)",
            background: "var(--eq-bg-surface)",
            boxShadow: "var(--eq-shadow-user-card)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img src={iconFilterSettings} alt="" width={22} height={22} />
        </button>
      </div>

      {/* Horizontal Subject Chips Row (Figma 174:209..235) */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 14 }}>
        <SubjectChip
          label="Tất cả"
          selected={filter.subjectIds.length === 0}
          onClick={() => setFilter((prev) => ({ ...prev, subjectIds: [] }))}
        />
        {quickSubjects.map((sub) => (
          <SubjectChip
            key={sub.id}
            label={sub.name}
            tone={sub.colorKey}
            selected={filter.subjectIds.includes(sub.id)}
            onClick={() => toggleQuickSubject(sub.id)}
          />
        ))}
        <SubjectChip label="+ Môn khác" tone="other" onClick={() => setPickerOpen(true)} />
      </div>

      {/* Active Filter Tags (Figma EduQuiz_KetQuaLoc 324:3768) */}
      {hasActiveFilters && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
            padding: "10px 12px",
            background: "var(--eq-bg-surface-soft)",
            borderRadius: "var(--eq-radius-lg)",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--eq-text-secondary)" }}>
            Đang lọc ({quizzes.length} đề):
          </span>

          {selectedSubjects.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                setFilter((prev) => ({
                  ...prev,
                  subjectIds: prev.subjectIds.filter((id) => id !== s.id),
                }))
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                border: "none",
                borderRadius: 99,
                padding: "4px 10px",
                background: "#fff",
                color: "var(--eq-primary-action)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>{s.name}</span>
              <X size={13} />
            </button>
          ))}

          {filter.examType !== "ALL" && (
            <button
              type="button"
              onClick={() => setFilter((prev) => ({ ...prev, examType: "ALL" }))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                border: "none",
                borderRadius: 99,
                padding: "4px 10px",
                background: "#fff",
                color: "var(--eq-primary-action)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>
                {filter.examType === "POPULAR"
                  ? "Phổ biến"
                  : filter.examType === "MOCK"
                    ? "Đề thi thử"
                    : "Theo chuyên đề"}
              </span>
              <X size={13} />
            </button>
          )}

          {filter.difficulty !== "ALL" && (
            <button
              type="button"
              onClick={() => setFilter((prev) => ({ ...prev, difficulty: "ALL" }))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                border: "none",
                borderRadius: 99,
                padding: "4px 10px",
                background: "#fff",
                color: "var(--eq-primary-action)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>Độ khó: {filter.difficulty}</span>
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={resetAllFilters}
            style={{
              marginLeft: "auto",
              border: "none",
              background: "transparent",
              color: "var(--eq-status-danger-border)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Xóa lọc
          </button>
        </div>
      )}

      {/* Main Responsive Area: Desktop Filter Aside + 2-col Exam Cards Grid */}
      <div className="eq-app-exams-layout">
        <aside className="eq-app-desktop-filter-aside">
          <div
            className="eq-app-user-card"
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 15 }}>Bộ lọc nhanh</strong>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  style={{ border: "none", background: "transparent", color: "var(--eq-primary-action)", fontSize: 12, fontWeight: 600 }}
                >
                  Đặt lại
                </button>
              )}
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Loại đề</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(
                  [
                    { key: "ALL", label: "Tất cả đề thi" },
                    { key: "POPULAR", label: "Đề phổ biến" },
                    { key: "MOCK", label: "Đề thi thử" },
                    { key: "TOPIC", label: "Theo chuyên đề" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter((prev) => ({ ...prev, examType: item.key }))}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: "var(--eq-radius-md)",
                      border: "none",
                      background: filter.examType === item.key ? "var(--eq-bg-surface-soft)" : "transparent",
                      color: filter.examType === item.key ? "var(--eq-primary-admin)" : "var(--eq-text-secondary)",
                      fontWeight: filter.examType === item.key ? 700 : 500,
                      fontSize: 13,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Độ khó</div>
              <SegmentedSelector
                ariaLabel="Độ khó"
                options={DIFFICULTY_OPTIONS}
                value={filter.difficulty}
                onChange={(difficulty) => setFilter((prev) => ({ ...prev, difficulty }))}
              />
            </div>

            <button
              type="button"
              className="eq-app-btn-secondary"
              style={{ width: "100%", height: 38, fontSize: 13 }}
              onClick={() => setPickerOpen(true)}
            >
              Chọn từ 24 môn học
            </button>
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="eq-app-exams-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="eq-app-skeleton" style={{ height: 112 }} />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div
              style={{
                background: "var(--eq-bg-surface)",
                border: "1px solid var(--eq-border-default)",
                borderRadius: "var(--eq-radius-card)",
                padding: "40px 24px",
                textAlign: "center",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontFamily: "var(--eq-font-heading)", fontSize: 18 }}>
                Không tìm thấy đề thi phù hợp
              </h3>
              <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--eq-text-muted)" }}>
                Hãy thử đổi môn học, giảm điều kiện lọc hoặc tự tạo một bộ đề mới.
              </p>
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ background: "var(--eq-primary-action)" }}
                onClick={resetAllFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="eq-app-exams-grid">
              {quizzes.map((quiz) => (
                <ExamCard
                  key={quiz.id}
                  quiz={quiz}
                  progressPercent={progressByQuizId.get(quiz.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ExamFilterSheet
        open={filterOpen}
        subjects={allSubjects}
        value={filter}
        onApply={setFilter}
        onOpenAllSubjects={() => setPickerOpen(true)}
        onClose={() => setFilterOpen(false)}
      />

      <SubjectPickerModal
        open={pickerOpen}
        subjects={allSubjects}
        selectedIds={filter.subjectIds}
        onApply={(subjectIds) => setFilter((prev) => ({ ...prev, subjectIds }))}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
