import { NavLink } from "react-router-dom";
import avatarDefault from "../../assets/figma/avatar-default.png";
import navClockActive from "../../assets/figma/nav-clock-active.png";
import navClockInactive from "../../assets/figma/nav-clock-inactive.png";
import navGradActive from "../../assets/figma/nav-graduation-active.svg";
import navGradInactive from "../../assets/figma/nav-graduation-inactive.svg";
import navHomeActiveHouse from "../../assets/figma/nav-home-active-house.svg";
import navHomeInactiveHouse from "../../assets/figma/nav-home-inactive-house.svg";
import navResourcesActive from "../../assets/figma/nav-resources-active.svg";
import navResourcesInactive from "../../assets/figma/nav-resources-inactive.svg";

interface BottomNavProps {
  avatarUrl?: string;
}

/** Figma Component Set `BottomNav` (181:313) — 5 tabs */
export default function BottomNav({ avatarUrl }: BottomNavProps) {
  return (
    <nav className="eq-app-bottom-nav" aria-label="Điều hướng chính">
      <NavLink
        to="/practice"
        className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}
        aria-label="Trang chủ"
      >
        {({ isActive }) => (
          <>
            <img src={isActive ? navHomeActiveHouse : navHomeInactiveHouse} alt="" width={24} height={24} />
            <span className="eq-app-bnav-indicator" />
          </>
        )}
      </NavLink>

      <NavLink
        to="/school"
        className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}
        aria-label="Trường học"
      >
        {({ isActive }) => (
          <>
            <img src={isActive ? navGradActive : navGradInactive} alt="" width={26} height={26} />
            <span className="eq-app-bnav-indicator" />
          </>
        )}
      </NavLink>

      <NavLink
        to="/exam"
        className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}
        aria-label="Đề thi"
      >
        {({ isActive }) => (
          <>
            <img src={isActive ? navResourcesActive : navResourcesInactive} alt="" width={24} height={24} />
            <span className="eq-app-bnav-indicator" />
          </>
        )}
      </NavLink>

      <NavLink
        to="/history"
        className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}
        aria-label="Lịch sử"
      >
        {({ isActive }) => (
          <>
            <img src={isActive ? navClockActive : navClockInactive} alt="" width={25} height={25} />
            <span className="eq-app-bnav-indicator" />
          </>
        )}
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}
        aria-label="Cá nhân"
      >
        <img
          src={avatarUrl || avatarDefault}
          alt="Hồ sơ cá nhân"
          className="eq-app-bnav-avatar"
        />
        <span className="eq-app-bnav-indicator" />
      </NavLink>
    </nav>
  );
}
