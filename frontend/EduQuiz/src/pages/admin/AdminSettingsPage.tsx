import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useUI } from "../../context/UIContext";
import { adminService } from "../../services/adminService";
import type { AdminSystemSettings } from "../../types/admin";

/** Figma Admin Screen 18: System Settings */
export default function AdminSettingsPage() {
  const { pushToast } = useUI();
  const [settings, setSettings] = useState<AdminSystemSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void adminService.getSystemSettings().then((s) => {
      if (active) setSettings(s);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!settings) return <div className="eq-app-skeleton" style={{ height: 280 }} />;

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.saveSystemSettings(settings);
      pushToast({ title: "Đã lưu cài đặt hệ thống", message: "Cấu hình chung đã được cập nhật vào IndexedDB." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
          Cài đặt hệ thống
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-admin-muted)" }}>
          Quản lý tên nền tảng, email hỗ trợ, phiên đăng nhập và chế độ bảo trì
        </p>
      </div>

      <section
        style={{
          background: "var(--eq-bg-surface)",
          border: "1px solid var(--eq-border-default)",
          borderRadius: "var(--eq-radius-banner)",
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tên hệ thống</label>
            <input
              type="text"
              value={settings.systemName}
              onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
              style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email hỗ trợ</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Ngôn ngữ mặc định</label>
            <input
              type="text"
              value={settings.defaultLanguage}
              onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
              style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Múi giờ</label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Số lần đăng nhập sai tối đa</label>
            <input
              type="number"
              min={3}
              max={10}
              value={settings.maxFailedLogins}
              onChange={(e) => setSettings({ ...settings, maxFailedLogins: Number(e.target.value) || 5 })}
              style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Thời gian hết hạn phiên (phút)</label>
            <input
              type="number"
              min={15}
              max={240}
              value={settings.sessionTimeoutMinutes}
              onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) || 60 })}
              style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
            />
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: 10,
            background: "var(--eq-bg-admin-android)",
            cursor: "pointer",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>Chế độ bảo trì</div>
            <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)" }}>
              Tạm thông báo bảo trì tới người dùng ngoài quản trị viên
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            style={{ width: 18, height: 18 }}
          />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ background: "var(--eq-primary-admin)" }}
            disabled={saving}
            onClick={() => void handleSave()}
          >
            <Save size={16} />
            <span>{saving ? "Đang lưu..." : "Lưu cấu hình"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
