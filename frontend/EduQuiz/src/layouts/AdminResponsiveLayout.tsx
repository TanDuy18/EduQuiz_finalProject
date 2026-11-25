import { BarChart3, Bell, FileQuestion, Flag, Home, Menu, Settings, ShieldCheck, Users } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useUserPreferences } from "../context/UserPreferencesContext";
import "../styles/web-ui.css";

export default function AdminResponsiveLayout() {
  const { isRealAdmin, isDemoAdmin, setDemoRoleOverride, storageMode } = useUserPreferences();
  const navigate = useNavigate();

  return (
    <div className="eq-app-root" style={{ fontFamily: "var(--eq-font-admin)" }}>
      {storageMode === "IN_MEMORY_FALLBACK" && (
        <div className="eq-app-degraded-banner">
          Degraded Mode (In-Memory): Các thay đổi Admin sẽ không được giữ lại sau khi F5.
        </div>
      )}

      {!isRealAdmin && isDemoAdmin && (
        <div className="eq-app-demo-banner">
          <span>[CHẾ ĐỘ XEM THỬ GIAO DIỆN ADMIN — DỮ LIỆU CỤC BỘ INDEXEDDB]</span>
          <button
            type="button"
            onClick={() => {
              setDemoRoleOverride("NONE");
              navigate("/practice");
            }}
            style={{
              border: "1px solid var(--eq-primary-admin)",
              background: "#fff",
              color: "var(--eq-primary-admin)",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Về giao diện học viên
          </button>
        </div>
      )}

      <div className="eq-app-shell">
        <aside className="eq-app-sidebar" aria-label="Menu quản trị Admin">
          <Link to="/admin" className="eq-app-brand" style={{ marginBottom: 16, padding: "4px 10px" }}>
            <span className="eq-app-brand-edu">Edu</span>
            <span className="eq-app-brand-quiz">Quiz</span>
          </Link>

          <NavLink end to="/admin" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <Home size={20} />
            <span className="eq-app-sidebar-label">Tổng quan</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <Users size={20} />
            <span className="eq-app-sidebar-label">Người dùng</span>
          </NavLink>
          <NavLink to="/admin/questions" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <FileQuestion size={20} />
            <span className="eq-app-sidebar-label">Ngân hàng câu hỏi</span>
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <Flag size={20} />
            <span className="eq-app-sidebar-label">Báo cáo sai</span>
          </NavLink>
          <NavLink to="/admin/analytics" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <BarChart3 size={20} />
            <span className="eq-app-sidebar-label">Phân tích</span>
          </NavLink>
          <NavLink to="/admin/notifications" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <Bell size={20} />
            <span className="eq-app-sidebar-label">Thông báo</span>
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <Settings size={20} />
            <span className="eq-app-sidebar-label">Cài đặt hệ thống</span>
          </NavLink>
          <NavLink to="/admin/security" className={({ isActive }) => `eq-app-nav-item ${isActive ? "active" : ""}`}>
            <ShieldCheck size={20} />
            <span className="eq-app-sidebar-label">Vai trò & bảo mật</span>
          </NavLink>
        </aside>

        <div className="eq-app-main-wrap">
          <main className="eq-app-content">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile 4-tab Admin Bottom Navigation (Figma 386:1217) */}
      <nav className="eq-app-bottom-nav admin-nav" aria-label="Điều hướng Admin">
        <NavLink end to="/admin" className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}>
          <Home size={20} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>Tổng quan</span>
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}>
          <Users size={20} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>Người dùng</span>
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}>
          <Flag size={20} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>Báo cáo</span>
        </NavLink>
        <NavLink to="/admin/settings" className={({ isActive }) => `eq-app-bnav-btn ${isActive ? "active" : ""}`}>
          <Menu size={20} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>Khác</span>
        </NavLink>
      </nav>
    </div>
  );
}
