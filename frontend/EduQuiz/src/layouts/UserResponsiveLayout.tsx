import { BookOpen, Clock, GraduationCap, Home, PlusCircle, Shield, User } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import iconBell from "../assets/figma/icon-bell.png";
import AppBlurredLoginModal from "../components/auth/AppBlurredLoginModal";
import BottomNav from "../components/common/BottomNav";
import { useUI } from "../context/UIContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useAuth } from "../hooks/useAuth";
import { webAuthBridge } from "../services/webAuthBridge";
import "../styles/web-ui.css";

export default function UserResponsiveLayout() {
  const { user, logout } = useAuth();
  const {
    selectedLevel,
    storageMode,
    effectiveRole,
    setDemoRoleOverride,
  } = useUserPreferences();
  const { pushToast } = useUI();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  const handleLogout = () => {
    void webAuthBridge.revokeServerSession();
    logout();
  };

  const handleOpenNotification = () => {
    pushToast({
      title: "EduQuiz",
      message: "Chào bạn đến với app EduQuiz! Bắt đầu phát triển bản thân nào.",
      timeLabel: "Vừa xong",
    });
  };

  return (
    <div className="eq-app-root eq-app-user-theme">
      {storageMode === "IN_MEMORY_FALLBACK" && (
        <div className="eq-app-degraded-banner">
          Trình duyệt đang hạn chế IndexedDB (Degraded Mode). Tiến độ làm bài sẽ không được giữ lại nếu bạn tải lại trang (F5).
        </div>
      )}

      <div className="eq-app-shell">
        {/* Tablet Rail / Desktop Sidebar */}
        <aside className="eq-app-sidebar" aria-label="Menu ứng dụng">
          <Link to="/" className="eq-app-brand eq-app-sidebar-brand">
            <span className="eq-app-brand-edu">Edu</span>
            <span className="eq-app-brand-quiz">Quiz</span>
          </Link>

          <NavLink to="/practice" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <Home size={20} />
            <span className="eq-app-sidebar-label">Trang chủ</span>
          </NavLink>

          <NavLink to="/school" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <GraduationCap size={20} />
            <span className="eq-app-sidebar-label">Trường học</span>
          </NavLink>

          <NavLink to="/exam" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <BookOpen size={20} />
            <span className="eq-app-sidebar-label">Đề thi</span>
          </NavLink>

          <NavLink to="/history" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <Clock size={20} />
            <span className="eq-app-sidebar-label">Lịch sử</span>
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <User size={20} />
            <span className="eq-app-sidebar-label">Cá nhân</span>
          </NavLink>

          <div className="eq-app-sidebar-desktop-only" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ width: "100%", background: "var(--eq-primary-create)", borderRadius: "var(--eq-radius-cta)" }}
              onClick={() => navigate("/create-quiz")}
            >
              <PlusCircle size={18} />
              <span>Tạo Quiz</span>
            </button>
          </div>

          <div className="eq-app-sidebar-desktop-only" style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--eq-border-user-card)" }}>
            <button
              type="button"
              className="eq-app-nav-item"
              style={{ width: "100%", padding: "10px 12px", fontSize: 13 }}
              onClick={() => {
                if (effectiveRole !== "ADMIN") setDemoRoleOverride("ADMIN");
                navigate("/admin");
              }}
            >
              <Shield size={18} />
              <span className="eq-app-sidebar-label">Khu quản trị Admin</span>
            </button>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="eq-app-main-wrap">
          <header className="eq-app-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "var(--eq-text-muted)" }}>
                Không gian học tập · <strong style={{ color: "var(--eq-text-primary)" }}>{selectedLevel === "UNIVERSITY" ? "Đại học" : selectedLevel}</strong>
              </span>
              <Link
                to="/onboarding"
                style={{ fontSize: 13, color: "var(--eq-primary-action)", textDecoration: "none", fontWeight: 600 }}
              >
                Đổi cấp học
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                type="button"
                aria-label="Thông báo"
                onClick={handleOpenNotification}
                style={{ position: "relative", border: "none", background: "transparent", padding: 4 }}
              >
                <img src={iconBell} alt="" width={24} height={24} />
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

              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</span>
                  <button type="button" className="eq-app-btn-secondary" style={{ height: 34, padding: "0 12px" }} onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="eq-app-btn-primary"
                  style={{ height: 36, padding: "0 14px", fontSize: 14 }}
                  onClick={() => setLoginOpen(true)}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </header>

          <main className="eq-app-content">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav avatarUrl={user?.avatar} />

      <AppBlurredLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
