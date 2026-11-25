import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import iconArrowRight from "../../assets/figma/icon-arrow-right.png";
import iconBell from "../../assets/figma/icon-bell.png";
import iconCoin from "../../assets/figma/icon-coin.png";
import iconFire from "../../assets/figma/icon-fire.gif";
import iconMenu from "../../assets/figma/icon-menu.png";
import iconReload from "../../assets/figma/icon-reload.png";
import iconStar from "../../assets/figma/icon-star.png";
import iconSubjectChemistry from "../../assets/figma/icon-subject-chemistry.png";
import iconSubjectEnglish from "../../assets/figma/icon-subject-english.png";
import iconSubjectLiterature from "../../assets/figma/icon-subject-literature.png";
import iconSubjectMath from "../../assets/figma/icon-subject-math.png";
import iconSubjectPhysics from "../../assets/figma/icon-subject-physics.png";
import AppBlurredLoginModal from "../../components/auth/AppBlurredLoginModal";
import HeroBannerCarousel from "../../components/common/HeroBannerCarousel";
import { useUI } from "../../context/UIContext";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { useAuth } from "../../hooks/useAuth";
import { attemptService } from "../../services/attemptService";
import { quizService } from "../../services/quizService";
import type { AttemptRecord } from "../../types/attempt";
import type { QuizRecord } from "../../types/quiz";

interface HomeCategoryTile {
  subjectId: string;
  label: string;
  icon: string;
  bg: string;
}

const THPT_CATEGORIES: HomeCategoryTile[] = [
  { subjectId: "sub_math", label: "Toán", icon: iconSubjectMath, bg: "var(--eq-cat-math-bg)" },
  { subjectId: "sub_literature", label: "Ngữ văn", icon: iconSubjectLiterature, bg: "var(--eq-cat-literature-bg)" },
  { subjectId: "sub_chemistry", label: "Hóa học", icon: iconSubjectChemistry, bg: "var(--eq-cat-chemistry-bg)" },
  { subjectId: "sub_physics", label: "Vật lý", icon: iconSubjectPhysics, bg: "var(--eq-cat-physics-bg)" },
  { subjectId: "sub_english", label: "Tiếng Anh", icon: iconSubjectEnglish, bg: "var(--eq-cat-english-bg)" },
];

const UNI_CATEGORIES: HomeCategoryTile[] = [
  { subjectId: "sub_advanced_math", label: "Toán cao cấp", icon: iconSubjectMath, bg: "var(--eq-cat-math-bg)" },
  { subjectId: "sub_programming", label: "Lập trình", icon: iconSubjectLiterature, bg: "var(--eq-cat-literature-bg)" },
  { subjectId: "sub_chemistry", label: "Hóa học", icon: iconSubjectChemistry, bg: "var(--eq-cat-chemistry-bg)" },
  { subjectId: "sub_physics", label: "Vật lý", icon: iconSubjectPhysics, bg: "var(--eq-cat-physics-bg)" },
  { subjectId: "sub_foreign_lang", label: "Ngoại ngữ", icon: iconSubjectEnglish, bg: "var(--eq-cat-english-bg)" },
];

/** Figma `iPhone Air - 11/12/13` (97:190, 97:426, 113:304) — Responsive App Home */
export default function AppHomePage() {
  const { selectedLevel } = useUserPreferences();
  const { user } = useAuth();
  const { pushToast } = useUI();
  const navigate = useNavigate();

  const [inProgress, setInProgress] = useState<AttemptRecord[]>([]);
  const [featuredQuiz, setFeaturedQuiz] = useState<QuizRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void Promise.all([
      attemptService.getInProgressAttempts(),
      quizService.getQuizById("fig_quiz_dhqg_2025"),
    ]).then(([attempts, hotQuiz]) => {
      if (!active) return;
      setInProgress(attempts);
      setFeaturedQuiz(hotQuiz);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const categories = selectedLevel === "UNIVERSITY" ? UNI_CATEGORIES : THPT_CATEGORIES;

  const handleOpenNotification = () => {
    pushToast({
      title: "EduQuiz",
      message: "Chào bạn đến với app EduQuiz! Bắt đầu phát triển bản thân nào.",
      timeLabel: "Vừa xong",
    });
  };

  return (
    <div>
      {/* Mobile Header (hidden on tablet/desktop where topbar takes over) */}
      <div
        className="eq-app-mobile-only-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Link to="/" className="eq-app-brand" style={{ fontSize: 28 }}>
          <span className="eq-app-brand-edu">Edu</span>
          <span className="eq-app-brand-quiz">Quiz</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!user && (
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              style={{
                border: "1px solid var(--eq-border-default)",
                background: "var(--eq-bg-surface)",
                borderRadius: "var(--eq-radius-full)",
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--eq-primary-action)",
              }}
            >
              Đăng nhập
            </button>
          )}

          <button
            type="button"
            aria-label="Mở thông báo"
            onClick={handleOpenNotification}
            style={{ position: "relative", border: "none", background: "transparent", padding: 4 }}
          >
            <img src={iconBell} alt="" width={26} height={26} />
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 8,
                height: 8,
                borderRadius: 99,
                background: "#ff7a1a",
              }}
            />
          </button>
        </div>
      </div>

      <div className="eq-app-home-grid">
        {/* Left / Main Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <HeroBannerCarousel />

          {/* 2 Mode Cards: Luyện tập & Thi thử (Figma 97:208, 97:212) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <button
              type="button"
              onClick={() => navigate("/exam?mode=PRACTICE")}
              style={{
                height: "var(--eq-card-mode-height)",
                borderRadius: "var(--eq-radius-lg)",
                border: "none",
                background: "var(--eq-mode-practice-bg)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                color: "var(--eq-text-primary)",
                boxShadow: "var(--eq-shadow-nav)",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 16, fontWeight: 700 }}>
                  Luyện tập
                </div>
                <div style={{ fontSize: 11, color: "rgba(17,24,39,0.72)", marginTop: 2 }}>
                  Ôn theo chuyên đề
                </div>
              </div>
              <img src={iconArrowRight} alt="" width={18} height={18} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/exam?popular=true")}
              style={{
                height: "var(--eq-card-mode-height)",
                borderRadius: "var(--eq-radius-lg)",
                border: "none",
                background: "var(--eq-mode-mock-exam-bg)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                color: "var(--eq-text-on-primary)",
                boxShadow: "var(--eq-shadow-nav)",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 16, fontWeight: 700 }}>
                  Thi thử
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.86)", marginTop: 2 }}>
                  Tính giờ như thi thật
                </div>
              </div>
              <img src={iconArrowRight} alt="" width={18} height={18} style={{ filter: "brightness(5)" }} />
            </button>
          </div>

          {/* Danh mục môn học (Level-aware: THPT vs Đại học) */}
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <img src={iconMenu} alt="" width={20} height={20} />
                <h2 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: 18, fontWeight: 700 }}>
                  Danh mục
                </h2>
              </div>
              <Link
                to="/exam"
                style={{ fontSize: 13, fontWeight: 600, color: "var(--eq-primary-link)", textDecoration: "none" }}
              >
                Xem tất cả
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
                gap: 12,
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat.subjectId}
                  type="button"
                  onClick={() => navigate(`/exam?subject=${cat.subjectId}`)}
                  style={{
                    border: "1px solid var(--eq-border-user-card)",
                    background: "var(--eq-bg-surface)",
                    borderRadius: "var(--eq-radius-lg)",
                    padding: "12px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "var(--eq-shadow-user-card)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--eq-radius-md)",
                      background: cat.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img src={cat.icon} alt="" width={24} height={24} style={{ objectFit: "contain" }} />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--eq-text-primary)",
                      textAlign: "center",
                      lineHeight: 1.25,
                    }}
                  >
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Đề thi nổi bật (Figma 94:31, 97:268) */}
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <img src={iconStar} alt="" width={20} height={20} />
                <h2 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: 18, fontWeight: 700 }}>
                  Đề thi nổi bật
                </h2>
              </div>
              <Link
                to="/exam?popular=true"
                style={{ fontSize: 13, fontWeight: 600, color: "var(--eq-primary-link)", textDecoration: "none" }}
              >
                Xem tất cả
              </Link>
            </div>

            {loading ? (
              <div className="eq-app-skeleton" style={{ height: 112 }} />
            ) : featuredQuiz ? (
              <div
                style={{
                  background: "#fffaf2",
                  borderRadius: "var(--eq-radius-cta)",
                  padding: "16px 18px",
                  border: "1px solid #f6cf9e",
                  boxShadow: "var(--eq-shadow-user-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "var(--eq-badge-hot-bg)",
                        color: "var(--eq-badge-hot-text)",
                        borderRadius: "var(--eq-radius-btn-pill)",
                        padding: "3px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <img src={iconFire} alt="" width={11} height={14} />
                      Hot
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--eq-text-secondary)" }}>
                      <img src={iconCoin} alt="" width={14} height={14} />
                      {featuredQuiz.attemptCountLabel} lượt thi
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 4px", fontFamily: "var(--eq-font-heading)", fontSize: 16, fontWeight: 700 }}>
                    {featuredQuiz.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--eq-text-muted)" }}>
                    {featuredQuiz.questionCount} câu · {featuredQuiz.durationMinutes} phút · {featuredQuiz.difficultyLabel}
                  </p>
                </div>

                <Link
                  to={`/exams/detail/${featuredQuiz.id}`}
                  style={{
                    background: "var(--eq-badge-hot-bg)",
                    color: "var(--eq-badge-cta-orange-text)",
                    borderRadius: "var(--eq-radius-btn-pill)",
                    padding: "9px 16px",
                    fontFamily: "var(--eq-font-heading)",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Làm ngay
                </Link>
              </div>
            ) : null}
          </section>
        </div>

        {/* Right Column on Desktop / Below on Mobile: Tiếp tục học */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section
            className="eq-app-user-card"
            style={{
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <img src={iconReload} alt="" width={18} height={18} />
                <h2 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: 17, fontWeight: 700 }}>
                  Tiếp tục học
                </h2>
              </div>
              <Link
                to="/history"
                style={{ fontSize: 12, fontWeight: 600, color: "var(--eq-primary-link)", textDecoration: "none" }}
              >
                Lịch sử
              </Link>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="eq-app-skeleton" style={{ height: 64 }} />
                <div className="eq-app-skeleton" style={{ height: 64 }} />
              </div>
            ) : inProgress.length === 0 ? (
              <div style={{ textAlign: "center", padding: "18px 8px", color: "var(--eq-text-muted)", fontSize: 13 }}>
                Chưa có bài làm dang dở. Chọn một đề thi để bắt đầu ngay!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {inProgress.slice(0, 3).map((att) => {
                  const pct = Math.min(
                    100,
                    Math.round((att.answeredCount / Math.max(1, att.totalCount)) * 100),
                  );
                  return (
                    <Link
                      key={att.id}
                      to={`/history/${att.id}`}
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "inherit",
                        border: "1px solid var(--eq-border-user-card)",
                        borderRadius: "var(--eq-radius-continue)",
                        padding: "12px 14px",
                        background: "var(--eq-bg-user-surface-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--eq-text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {att.quizTitle}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--eq-primary-progress)" }}>
                          {pct}%
                        </span>
                      </div>

                      <div
                        style={{
                          height: 7,
                          width: "100%",
                          borderRadius: 99,
                          background: "var(--eq-bg-progress-track)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            borderRadius: 99,
                            background: "var(--eq-primary-progress)",
                          }}
                        />
                      </div>

                      <div style={{ marginTop: 6, fontSize: 11, color: "var(--eq-text-muted)" }}>
                        Đã làm {att.answeredCount}/{att.totalCount} câu · {att.subjectName}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Action Card */}
          <div
            style={{
              background: "var(--eq-bg-surface-soft)",
              borderRadius: "var(--eq-radius-card)",
              padding: 16,
              border: "1px solid #cdddfd",
            }}
          >
            <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              Tự tạo bộ đề riêng
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--eq-text-secondary)", lineHeight: 1.45 }}>
              Dán nhanh hàng loạt câu hỏi trắc nghiệm để luyện tập hoặc chia sẻ cho lớp học.
            </p>
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ width: "100%", height: 38, fontSize: 14, background: "var(--eq-primary-create)" }}
              onClick={() => navigate("/create-quiz")}
            >
              + Tạo Quiz ngay
            </button>
          </div>
        </aside>
      </div>

      <AppBlurredLoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
