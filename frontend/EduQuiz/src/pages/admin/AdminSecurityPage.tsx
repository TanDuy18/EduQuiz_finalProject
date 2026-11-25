import { Save, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useUI } from "../../context/UIContext";
import { useDebounce } from "../../hooks/useDebounce";
import { adminService } from "../../services/adminService";
import type { AdminAuditLogRecord, AdminSecurityPolicies } from "../../types/admin";

/** Figma Admin Screen 19: Security Policies & Access Audit Logs */
export default function AdminSecurityPage() {
  const { pushToast } = useUI();
  const [policies, setPolicies] = useState<AdminSecurityPolicies | null>(null);
  const [logs, setLogs] = useState<AdminAuditLogRecord[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void adminService.getSecurityPolicies().then((p) => {
      if (active) setPolicies(p);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void adminService.getAuditLogs({ page: 1, size: 50, search: debouncedSearch }).then((res) => {
      if (active) setLogs(res.items);
    });
    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  const handleSave = async () => {
    if (!policies) return;
    setSaving(true);
    try {
      await adminService.saveSecurityPolicies(policies);
      pushToast({ title: "Đã cập nhật chính sách bảo mật", message: "Các thiết lập phân quyền và bảo mật đã được lưu." });
    } finally {
      setSaving(false);
    }
  };

  const POLICY_ITEMS: { key: keyof AdminSecurityPolicies; title: string; desc: string }[] = [
    { key: "requireAdmin2FA", title: "Bắt buộc xác thực 2 bước (2FA) cho Admin", desc: "Yêu cầu mã OTP mỗi lần đăng nhập bảng quản trị." },
    { key: "enableSSO", title: "Bật đăng nhập một lần (Google SSO)", desc: "Cho phép xác thực tập trung bằng tài khoản tổ chức." },
    { key: "strongPasswordMin12", title: "Mật khẩu mạnh tối thiểu 12 ký tự", desc: "Áp dụng cho tài khoản giảng viên và quản trị viên." },
    { key: "autoLogout60Min", title: "Tự động đăng xuất sau 60 phút không hoạt động", desc: "Giảm rủi ro lộ phiên làm việc trên máy công cộng." },
    { key: "enableAccessAuditLog", title: "Ghi nhật ký kiểm toán truy cập (Audit Log)", desc: "Lưu vết thay đổi câu hỏi, khóa tài khoản và phiên giám sát AI." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
          Vai trò, Bảo mật & Nhật ký
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-admin-muted)" }}>
          Thiết lập chính sách an toàn truy cập và theo dõi nhật ký thao tác hệ thống
        </p>
      </div>

      {/* Policies */}
      {policies && (
        <section
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color="var(--eq-primary-admin)" />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
              Chính sách bảo mật
            </h2>
          </div>

          {POLICY_ITEMS.map((item) => (
            <label
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--eq-bg-admin-android)",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--eq-text-admin-primary)" }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)" }}>{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={policies[item.key]}
                onChange={(e) => setPolicies({ ...policies, [item.key]: e.target.checked })}
                style={{ width: 18, height: 18, flexShrink: 0 }}
              />
            </label>
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ background: "var(--eq-primary-admin)" }}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              <Save size={15} />
              <span>{saving ? "Đang lưu..." : "Lưu chính sách"}</span>
            </button>
          </div>
        </section>
      )}

      {/* Audit Logs */}
      <section
        style={{
          background: "var(--eq-bg-surface)",
          border: "1px solid var(--eq-border-default)",
          borderRadius: "var(--eq-radius-banner)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Nhật ký kiểm toán (Audit Logs)
          </h2>
          <div className="eq-app-search-box" style={{ width: "min(280px, 100%)", height: 38, boxShadow: "none" }}>
            <Search size={15} color="var(--eq-text-admin-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Lọc hành động hoặc email..."
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: "var(--eq-bg-admin-android)",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--eq-text-admin-primary)" }}>{log.action}</div>
                <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)" }}>
                  {log.actorEmail} · {log.timestampLabel}
                </div>
              </div>
              <span className="eq-app-badge-pill" style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-admin)" }}>
                {log.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
