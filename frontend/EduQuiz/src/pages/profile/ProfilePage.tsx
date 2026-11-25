import { BookMarked, CheckCircle2, Clock, Database, GraduationCap, LogIn, LogOut, Server, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import avatarDefault from "../../assets/figma/avatar-default.png";
import AppBlurredLoginModal from "../../components/auth/AppBlurredLoginModal";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { useAuth } from "../../hooks/useAuth";
import { webAuthBridge } from "../../services/webAuthBridge";

const PACKAGE_LABELS: Record<string, string> = {
  FREE: "Gói Miễn phí",
  ONE_WEEK: "Gói 1 Tuần",
  ONE_MONTH: "Gói 1 Tháng",
  ONE_YEAR: "Gói 1 Năm",
};

/** Student Profile & Real Backend Integration Status Hub */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const {
    selectedLevel,
    storageMode,
    fullProfile,
    isRealAdmin,
    effectiveRole,
    setDemoRoleOverride,
  } = useUserPreferences();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  const handleLogout = () => {
    void webAuthBridge.revokeServerSession();
    logout();
  };

  const apiUrl = import.meta.env.VITE_API_URL || "Chưa cấu hình VITE_API_URL";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--eq-font-heading)", fontSize: "var(--eq-text-screen-title)" }}>
          Hồ sơ cá nhân
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--eq-text-muted)" }}>
          Quản lý tài khoản Backend, cấp học và truy cập nhanh kho đề của bạn
        </p>
      </div>

      {/* Account Card (Hydrated from real GET /api/v1/auth/me) */}
      <section
        className="eq-app-user-card"
        style={{
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src={user?.avatar || avatarDefault}
              alt="Ảnh đại diện"
              width={64}
              height={64}
              style={{ borderRadius: 99, objectFit: "cover", border: "2px solid var(--eq-border-user-card)" }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
                  {user ? user.name : "Khách trải nghiệm EduQuiz"}
                </h2>
                {fullProfile && (
                  <span
                    className="eq-app-badge-pill"
                    style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-admin)" }}
                  >
                    {fullProfile.role}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--eq-text-muted)" }}>
                {user ? user.email : "Đăng nhập bằng tài khoản Backend hoặc Google để đồng bộ dữ liệu thật"}
              </div>
            </div>
          </div>

          {user ? (
            <button type="button" className="eq-app-btn-secondary" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          ) : (
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ background: "var(--eq-primary-admin)" }}
              onClick={() => setLoginOpen(true)}
            >
              <LogIn size={16} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>

        {/* Real Backend UserDto details when authenticated */}
        {fullProfile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
              paddingTop: 14,
              borderTop: "1px solid var(--eq-border-user-card)",
            }}
          >
            <div style={{ padding: 10, borderRadius: 10, background: "var(--eq-bg-user-surface-subtle)" }}>
              <div style={{ fontSize: 11, color: "var(--eq-text-muted)" }}>Gói tài khoản</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {PACKAGE_LABELS[fullProfile.packageOwned] ?? fullProfile.packageOwned}
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: "var(--eq-bg-user-surface-subtle)" }}>
              <div style={{ fontSize: 11, color: "var(--eq-text-muted)" }}>Lượt miễn phí còn lại</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{fullProfile.freeAccess}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: "var(--eq-bg-user-surface-subtle)" }}>
              <div style={{ fontSize: 11, color: "var(--eq-text-muted)" }}>Hạn gói</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{fullProfile.endDatePackage ?? "Không giới hạn"}</div>
            </div>
          </div>
        )}
      </section>

      {/* Quick Settings Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <Link
          to="/onboarding"
          className="eq-app-user-card"
          style={{ padding: 18, textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
        >
          <GraduationCap size={22} color="var(--eq-primary-admin)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Cấp học: {selectedLevel === "UNIVERSITY" ? "Đại học" : selectedLevel}</div>
            <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>Bấm để chọn lại cấp học</div>
          </div>
        </Link>

        <Link
          to="/my-quizzes"
          className="eq-app-user-card"
          style={{ padding: 18, textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
        >
          <BookMarked size={22} color="var(--eq-primary-quiz)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Đề của tôi & Đề đã lưu</div>
            <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>Quản lý bộ đề tự soạn và bản nháp</div>
          </div>
        </Link>

        <Link
          to="/history"
          className="eq-app-user-card"
          style={{ padding: 18, textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
        >
          <Clock size={22} color="var(--eq-primary-progress)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Lịch sử & Thống kê</div>
            <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>Xem lại điểm số và tiến độ</div>
          </div>
        </Link>

        <div className="eq-app-user-card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <Database size={22} color="var(--eq-status-success-border)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Lưu trữ cục bộ: {storageMode === "INDEXED_DB" ? "IndexedDB" : "In-Memory"}
            </div>
            <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>Tự động lưu cho phân hệ chờ API</div>
          </div>
        </div>
      </div>

      {/* Backend Integration Status Card */}
      <section className="eq-app-user-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Server size={18} color="var(--eq-primary-admin)" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Trạng thái tích hợp Backend ({apiUrl})</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--eq-text-secondary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={15} color="var(--eq-status-success-border)" />
            <span>
              <strong>Đang nối API thật:</strong> Auth (<code>/auth/google</code>, <code>/auth/login</code>, <code>/auth/refresh</code>, <code>/auth/logout</code>, <code>/auth/me</code>) &amp; <code>GET /attempts/in-progress</code>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={15} color="var(--eq-primary-action)" />
            <span>
              <strong>Tạm dùng IndexedDB (chờ Backend bổ sung Controller):</strong> Danh sách đề thi, Tạo đề, Chấm điểm/Lịch sử, Admin &amp; Giám sát AI
            </span>
          </div>
        </div>
      </section>

      {/* Admin Preview Switch */}
      <section
        className="eq-app-user-card"
        style={{
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Shield size={24} color="var(--eq-primary-admin)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Khu vực Quản trị viên ({isRealAdmin ? "Tài khoản Admin thật" : "Chế độ xem thử Demo"})
            </div>
            <div style={{ fontSize: 13, color: "var(--eq-text-muted)" }}>
              19 màn hình quản trị trên dữ liệu IndexedDB cục bộ
            </div>
          </div>
        </div>

        <button
          type="button"
          className="eq-app-btn-primary"
          style={{ background: "var(--eq-primary-admin)" }}
          onClick={() => {
            if (effectiveRole !== "ADMIN") setDemoRoleOverride("ADMIN");
            navigate("/admin");
          }}
        >
          <Sparkles size={16} />
          <span>Mở Admin Console</span>
        </button>
      </section>

      <AppBlurredLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
