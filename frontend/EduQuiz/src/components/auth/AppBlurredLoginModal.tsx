import { useState, type FormEvent } from "react";
import iconGoogle from "../../assets/figma/icon-google.png";
import { useAuth } from "../../hooks/useAuth";
import { webAuthBridge } from "../../services/webAuthBridge";
import { ApiError } from "../../utils/api";

interface AppBlurredLoginModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

/**
 * Figma `iPhone Air - 9/10` (77:4, 94:49) — Blurred Login Overlay
 * Supports BOTH real Backend AuthController endpoints:
 * 1. POST /api/v1/auth/login (username + password via webAuthBridge)
 * 2. POST /api/v1/auth/google (delegated to existing useAuth().requireAuth())
 */
export default function AppBlurredLoginModal({
  open,
  onClose,
  title = "Đăng nhập EduQuiz",
  description = "Đăng nhập bằng tài khoản Backend hoặc Google để đồng bộ hồ sơ và tiến độ học.",
}: AppBlurredLoginModalProps) {
  const { requireAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await webAuthBridge.loginWithPassword(username, password);
      onClose();
      // Hydrate locked AuthContext via GET /api/v1/auth/me without modifying AuthContext.tsx
      window.location.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(
          err.status === 401
            ? "Sai tên đăng nhập hoặc mật khẩu."
            : `Backend trả lỗi ${err.status}. Kiểm tra lại tài khoản.`,
        );
      } else {
        setErrorMsg("Không thể kết nối Backend API. Hãy kiểm tra server Spring Boot đang chạy.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueGoogle = () => {
    onClose();
    requireAuth();
  };

  return (
    <div
      className="eq-app-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{ alignItems: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--eq-bg-surface)",
          borderRadius: "var(--eq-radius-modal)",
          padding: "26px 24px 22px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(19, 44, 74, 0.24)",
        }}
      >
        <div className="eq-app-brand" style={{ fontSize: 30, marginBottom: 6 }}>
          <span className="eq-app-brand-edu">Edu</span>
          <span className="eq-app-brand-quiz">Quiz</span>
        </div>

        <h3
          style={{
            margin: "0 0 6px",
            fontFamily: "var(--eq-font-heading)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--eq-text-primary)",
          }}
        >
          {title}
        </h3>

        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--eq-text-muted)", lineHeight: 1.45 }}>
          {description}
        </p>

        {/* Real Backend POST /api/v1/auth/login Form */}
        <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 14 }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tên đăng nhập (vd: duy, minhanh, giangvien)"
            autoComplete="username"
            style={{
              width: "100%",
              height: 42,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid var(--eq-border-user-card)",
              fontSize: 14,
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            autoComplete="current-password"
            style={{
              width: "100%",
              height: 42,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid var(--eq-border-user-card)",
              fontSize: 14,
            }}
          />

          {errorMsg && (
            <div
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--eq-status-danger-bg)",
                color: "var(--eq-status-danger-text)",
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="eq-app-btn-primary"
            style={{ width: "100%", height: 42, fontSize: 15, background: "var(--eq-primary-admin)" }}
          >
            {submitting ? "Đang xác thực..." : "Đăng nhập bằng tài khoản"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "12px 0",
            fontSize: 12,
            color: "var(--eq-text-muted)",
          }}
        >
          <span style={{ flex: 1, height: 1, background: "var(--eq-border-default)" }} />
          <span>hoặc</span>
          <span style={{ flex: 1, height: 1, background: "var(--eq-border-default)" }} />
        </div>

        <button
          type="button"
          onClick={handleContinueGoogle}
          style={{
            width: "100%",
            height: 46,
            borderRadius: "var(--eq-radius-google-btn)",
            border: "1px solid var(--eq-border-default)",
            background: "var(--eq-bg-google-btn)",
            boxShadow: "var(--eq-shadow-google-btn)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontFamily: "var(--eq-font-heading)",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--eq-text-primary)",
          }}
        >
          <img src={iconGoogle} alt="" width={22} height={22} />
          <span>Tiếp tục với Google</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 14,
            border: "none",
            background: "transparent",
            color: "var(--eq-text-muted)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Để sau
        </button>
      </div>
    </div>
  );
}
