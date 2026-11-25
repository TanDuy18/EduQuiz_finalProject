import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bannerArrowBlue from "../../assets/figma/banner-arrow-blue.svg";
import bannerArrowOrange from "../../assets/figma/banner-arrow-orange.svg";
import bannerArrowPurple from "../../assets/figma/banner-arrow-purple.svg";
import bannerCirclesBlue from "../../assets/figma/banner-circles-blue.svg";
import bannerCirclesOrange from "../../assets/figma/banner-circles-orange.svg";
import iconFire from "../../assets/figma/icon-fire.gif";

interface BannerSlide {
  id: number;
  variantClass: "variant-1" | "variant-2" | "variant-3";
  tag: string;
  tagBg: string;
  tagColor: string;
  showFire: boolean;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaColor: string;
  arrowIcon: string;
  circlesIcon: string;
  targetRoute: string;
}

/** Figma Component Set `Banner` (122:566) — 3 variants */
const SLIDES: BannerSlide[] = [
  {
    id: 0,
    variantClass: "variant-1",
    tag: "Học thông minh hơn",
    tagBg: "var(--eq-banner-1-tag-bg)",
    tagColor: "var(--eq-banner-1-tag-text)",
    showFire: true,
    title: "Chinh phục kiến thức cùng EduQuiz !",
    subtitle: "Luyện tập, thi thử và theo dõi kết quả dễ dàng",
    ctaLabel: "Bắt đầu học",
    ctaColor: "var(--eq-primary-banner-text)",
    arrowIcon: bannerArrowBlue,
    circlesIcon: bannerCirclesBlue,
    targetRoute: "/exam",
  },
  {
    id: 1,
    variantClass: "variant-2",
    tag: "Theo dõi tiến bộ",
    tagBg: "var(--eq-banner-2-tag-bg)",
    tagColor: "var(--eq-banner-2-accent)",
    showFire: false,
    title: "Mỗi ngày tiến bộ một chút",
    subtitle: "Luyện tập, thi thử và theo dõi kết quả dễ dàng",
    ctaLabel: "Xem thống kê",
    ctaColor: "var(--eq-banner-2-accent)",
    arrowIcon: bannerArrowOrange,
    circlesIcon: bannerCirclesOrange,
    targetRoute: "/history",
  },
  {
    id: 2,
    variantClass: "variant-3",
    tag: "Thử thách mới",
    tagBg: "var(--eq-banner-3-tag-bg)",
    tagColor: "var(--eq-banner-3-accent)",
    showFire: false,
    title: "Đề thi đa dạng, cập nhập liên tục",
    subtitle: "Luyện tập, thi thử và theo dõi kết quả dễ dàng",
    ctaLabel: "Làm đề ngay",
    ctaColor: "var(--eq-banner-3-accent)",
    arrowIcon: bannerArrowPurple,
    circlesIcon: bannerCirclesBlue,
    targetRoute: "/exam",
  },
];

export default function HeroBannerCarousel() {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [active]);

  const slide = SLIDES[active];

  return (
    <div className="eq-app-banner-wrap">
      <div className={`eq-app-banner-card ${slide.variantClass}`}>
        <img src={slide.circlesIcon} alt="" className="eq-app-banner-circles" />

        <div
          className="eq-app-banner-tag"
          style={{ background: slide.tagBg, color: slide.tagColor }}
        >
          {slide.showFire && <img src={iconFire} alt="" width={11} height={14} />}
          <span>{slide.tag}</span>
        </div>

        <h2 className="eq-app-banner-title">{slide.title}</h2>
        <p className="eq-app-banner-subtitle">{slide.subtitle}</p>

        <button
          type="button"
          className="eq-app-banner-cta"
          style={{ color: slide.ctaColor }}
          onClick={() => navigate(slide.targetRoute)}
        >
          <span>{slide.ctaLabel}</span>
          <img
            src={slide.arrowIcon}
            alt=""
            width={6}
            height={10}
            style={{ transform: "rotate(180deg)" }}
          />
        </button>
      </div>

      <div className="eq-app-banner-dots" role="tablist" aria-label="Banner khuyến nghị">
        {SLIDES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === active}
            aria-label={`Banner ${s.id + 1}`}
            className={`eq-app-banner-dot ${s.id === active ? "active" : ""}`}
            onClick={() => setActive(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
