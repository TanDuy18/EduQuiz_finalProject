import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import studentAnimation from "../../assets/Home/STUDENT.lottie";
import iconBook from "../../assets/figma/icon-book.png";
import iconCheckSelected from "../../assets/figma/icon-check-selected.png";
import iconDoneUnchecked from "../../assets/figma/icon-done-unchecked.png";
import iconFile from "../../assets/figma/icon-file.png";
import iconGraduationHat from "../../assets/figma/icon-graduation-hat.png";
import iconLoop from "../../assets/figma/icon-loop.png";
import iconSmartphone from "../../assets/figma/icon-smartphone.png";
import iconUniversity from "../../assets/figma/icon-university.png";
import onboardingScribble from "../../assets/figma/onboarding-scribble.png";
import onboardingWelcome from "../../assets/figma/onboarding-welcome.png";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import "../../styles/web-ui.css";
import type { EducationLevelCode } from "../../types/quiz";

const LEVEL_CARDS: {
  code: EducationLevelCode;
  title: string;
  subtitle: string;
  icon: string;
  tileBg: string;
}[] = [
  {
    code: "THCS",
    title: "THCS",
    subtitle: "Lớp 6 - 9",
    icon: iconGraduationHat,
    tileBg: "var(--eq-tile-level-thcs)",
  },
  {
    code: "THPT",
    title: "THPT",
    subtitle: "Lớp 10 - 12",
    icon: iconBook,
    tileBg: "var(--eq-tile-level-thpt)",
  },
  {
    code: "UNIVERSITY",
    title: "Đại học",
    subtitle: "Tất cả các ngành",
    icon: iconUniversity,
    tileBg: "var(--eq-tile-level-uni)",
  },
];

const FEATURES = [
  {
    icon: iconFile,
    tileBg: "var(--eq-tile-feature-blue)",
    title: "Đề thi đa dạng",
    description: "Hàng nghìn câu hỏi trắc nghiệm bao phủ đủ mọi môn học và chuyên đề trọng tâm.",
  },
  {
    icon: iconLoop,
    tileBg: "var(--eq-tile-feature-purple)",
    title: "Bám sát chương trình",
    description: "Cấu trúc đề bám sát đề minh họa, ôn luyện đúng trọng tâm và xem giải thích chi tiết.",
  },
  {
    icon: iconSmartphone,
    tileBg: "var(--eq-tile-feature-sage)",
    title: "Học mọi lúc, mọi nơi",
    description: "Đồng bộ tiến độ tự động, làm tiếp ngay trên trình duyệt mà không lo mất bài.",
  },
];

const STEPS = [
  {
    num: "01",
    color: "var(--eq-onboarding-step1-text)",
    title: "Chọn đề thi",
    desc: "Lọc theo cấp học, môn học và mức độ phù hợp với mục tiêu của bạn.",
  },
  {
    num: "02",
    color: "var(--eq-onboarding-step2-text)",
    title: "Làm bài",
    desc: "Trải nghiệm phòng thi trực quan, đánh dấu câu khó và lưu đáp án tự động.",
  },
  {
    num: "03",
    color: "var(--eq-primary-onboarding)",
    title: "Xem kết quả",
    desc: "Chấm điểm tức thì, xem giải thích từng câu và làm lại riêng các câu sai.",
  },
];

/** Figma Section 1:2 (iPhone Air 1..8) — 5-slide Responsive Onboarding */
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const { setSelectedLevel, markOnboardingDone } = useUserPreferences();
  const [pickedLevel, setPickedLevel] = useState<EducationLevelCode | null>(null);
  const navigate = useNavigate();

  const totalSteps = 5;

  const handleSkip = () => {
    markOnboardingDone();
    navigate("/practice");
  };

  const handleComplete = () => {
    if (!pickedLevel) return;
    setSelectedLevel(pickedLevel);
    markOnboardingDone();
    navigate("/practice");
  };

  return (
    <div
      className="eq-app-root eq-app-user-theme"
      style={{
        background: "var(--eq-bg-user-page)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          minHeight: "min(760px, calc(100dvh - 40px))",
          background: "var(--eq-bg-surface)",
          borderRadius: 28,
          border: "1px solid var(--eq-border-user-card)",
          boxShadow: "0 14px 36px rgba(19, 44, 74, 0.09)",
          padding: "24px 24px 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        {/* Top Row: Step indicator + Skip */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="eq-app-brand" style={{ fontSize: 22 }}>
              <span className="eq-app-brand-edu">Edu</span>
              <span className="eq-app-brand-quiz">Quiz</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--eq-text-muted-neutral)",
              fontSize: 14,
              fontWeight: 400,
              padding: "4px 6px",
            }}
          >
            Bỏ qua
          </button>
        </div>

        {/* Slide Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {step === 0 && (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 500,
                  color: "var(--eq-text-welcome)",
                  lineHeight: 1.25,
                }}
              >
                Chào mừng đến với
              </p>
              <h1 style={{ margin: "4px 0 8px", fontSize: 44, fontWeight: 700, lineHeight: 1.1 }}>
                <span className="eq-app-brand-edu">Edu</span>
                <span className="eq-app-brand-quiz">Quiz</span>
              </h1>
              <img
                src={onboardingScribble}
                alt=""
                style={{ width: 150, height: "auto", margin: "0 auto 14px", display: "block" }}
              />
              <img
                src={onboardingWelcome}
                alt="Minh họa học tập EduQuiz"
                style={{
                  width: "100%",
                  maxWidth: 280,
                  height: "auto",
                  margin: "0 auto 16px",
                  display: "block",
                  objectFit: "contain",
                }}
              />
              <p style={{ margin: 0, fontSize: 16, color: "var(--eq-text-secondary)", fontWeight: 500 }}>
                Học tập dễ dàng, hiệu quả hơn
              </p>
            </div>
          )}

          {step === 1 && (
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "var(--eq-onboarding-badge-bg)",
                  color: "var(--eq-onboarding-badge-text)",
                  borderRadius: "var(--eq-radius-full)",
                  padding: "6px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                Về EduQuiz
              </span>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontFamily: "var(--eq-font-heading)",
                  fontSize: 26,
                  lineHeight: 1.3,
                  color: "var(--eq-text-primary)",
                }}
              >
                Không chỉ là luyện đề, mà là hành trình phát triển
              </h2>
              <div style={{ width: 240, height: 220, margin: "8px auto" }}>
                <DotLottieReact src={studentAnimation} loop autoplay />
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--eq-text-muted)", lineHeight: 1.55 }}>
                Hệ thống luyện thi thông minh giúp bạn đánh giá năng lực chính xác theo từng chuyên đề.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "var(--eq-onboarding-badge-bg)",
                  color: "var(--eq-onboarding-badge-text)",
                  borderRadius: "var(--eq-radius-full)",
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                Ưu điểm nổi bật
              </span>
              <h2
                style={{
                  margin: "0 0 18px",
                  fontFamily: "var(--eq-font-heading)",
                  fontSize: 26,
                  lineHeight: 1.25,
                  color: "var(--eq-text-primary)",
                }}
              >
                Trải nghiệm ôn thi chuẩn mực trên <span className="eq-app-brand-quiz">EduQuiz</span>
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      background: "var(--eq-bg-surface)",
                      borderRadius: "var(--eq-radius-md)",
                      padding: 14,
                      border: "1px solid var(--eq-border-default)",
                      boxShadow: "0 4px 12px rgba(19, 44, 74, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "var(--eq-radius-sm)",
                        background: f.tileBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <img src={f.icon} alt="" width={24} height={24} style={{ objectFit: "contain" }} />
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "var(--eq-text-black)" }}>
                        {f.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--eq-text-muted)", lineHeight: 1.45 }}>
                        {f.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "var(--eq-onboarding-badge-bg)",
                  color: "var(--eq-onboarding-badge-text)",
                  borderRadius: "var(--eq-radius-full)",
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                Cách hoạt động
              </span>
              <h2
                style={{
                  margin: "0 0 22px",
                  fontFamily: "var(--eq-font-heading)",
                  fontSize: 28,
                  lineHeight: 1.25,
                }}
              >
                Chỉ 3 bước đơn giản
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {STEPS.map((item) => (
                  <div key={item.num} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "var(--eq-radius-full)",
                        background: "var(--eq-bg-surface-soft)",
                        color: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--eq-font-heading)",
                        fontSize: 18,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {item.num}
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "var(--eq-text-primary)" }}>
                        {item.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--eq-text-muted)", lineHeight: 1.5 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "var(--eq-onboarding-badge-bg)",
                  color: "var(--eq-onboarding-badge-text)",
                  borderRadius: "var(--eq-radius-full)",
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                Cá nhân hóa lộ trình
              </span>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontFamily: "var(--eq-font-heading)",
                  fontSize: 28,
                  lineHeight: 1.25,
                }}
              >
                Chọn cấp học của bạn
              </h2>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--eq-text-muted)" }}>
                EduQuiz sẽ đề xuất đúng danh mục môn học và bộ đề tương ứng.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {LEVEL_CARDS.map((card) => {
                  const selected = pickedLevel === card.code;
                  return (
                    <button
                      key={card.code}
                      type="button"
                      onClick={() => setPickedLevel(card.code)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        width: "100%",
                        minHeight: "var(--eq-card-level-height)",
                        padding: "12px 16px",
                        borderRadius: "var(--eq-radius-cta)",
                        border: selected
                          ? "2px solid var(--eq-border-selected-level)"
                          : "1.5px solid var(--eq-border-card-level)",
                        background: selected ? "var(--eq-bg-surface-selected)" : "var(--eq-bg-surface)",
                        textAlign: "left",
                        transition: "background-color 0.15s ease, border-color 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: "var(--eq-radius-lg)",
                          background: card.tileBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <img src={card.icon} alt="" width={26} height={26} style={{ objectFit: "contain" }} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--eq-text-primary)" }}>
                          {card.title}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--eq-text-muted)" }}>{card.subtitle}</div>
                      </div>

                      <img
                        src={selected ? iconCheckSelected : iconDoneUnchecked}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls: Pagination Dots + Back/Next CTA */}
        <div>
          <div className="eq-app-banner-dots" style={{ marginBottom: 16 }}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Bước ${idx + 1}`}
                className={`eq-app-banner-dot ${idx === step ? "active" : ""}`}
                onClick={() => setStep(idx)}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {step > 0 && (
              <button
                type="button"
                className="eq-app-btn-secondary"
                style={{ flex: "0 0 110px" }}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Quay lại
              </button>
            )}

            {step < totalSteps - 1 ? (
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ flex: 1 }}
                onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ flex: 1 }}
                disabled={!pickedLevel}
                onClick={handleComplete}
              >
                Bắt đầu học
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
