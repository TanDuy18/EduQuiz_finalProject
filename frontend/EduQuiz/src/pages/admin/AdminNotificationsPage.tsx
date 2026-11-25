import { Bell, Plus, Send } from "lucide-react";
import { useEffect, useState } from "react";
import ResponsiveModalOrSheet from "../../components/common/ResponsiveModalOrSheet";
import { useUI } from "../../context/UIContext";
import { adminService } from "../../services/adminService";
import type { AdminNotificationRecord } from "../../types/admin";

/**
 * Figma Admin Screens 16 & 17:
 * System Notifications Feed & Compose Broadcast Modal.
 */
export default function AdminNotificationsPage() {
  const { pushToast } = useUI();
  const [items, setItems] = useState<AdminNotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("Tất cả người dùng");
  const [scheduleLabel, setScheduleLabel] = useState("Gửi ngay");

  const load = () => {
    setLoading(true);
    void adminService.getNotifications().then((list) => {
      setItems(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      pushToast({ title: "Thiếu nội dung", message: "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo." });
      return;
    }
    await adminService.sendBroadcastNotification({
      title: title.trim(),
      body: body.trim(),
      audience,
      scheduleLabel,
    });
    pushToast({ title: "Đã gửi thông báo", message: `"${title.trim()}" tới nhóm ${audience}.` });
    setTitle("");
    setBody("");
    setComposeOpen(false);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Thông báo hệ thống
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-admin-muted)" }}>
            Quản lý lịch sử thông báo đẩy và gửi thông báo hàng loạt tới học viên / giảng viên
          </p>
        </div>

        <button
          type="button"
          className="eq-app-btn-primary"
          style={{ height: 38, padding: "0 14px", fontSize: 13, background: "var(--eq-primary-admin)" }}
          onClick={() => setComposeOpen(true)}
        >
          <Plus size={16} />
          <span>Soạn thông báo</span>
        </button>
      </div>

      {loading ? (
        <div className="eq-app-skeleton" style={{ height: 220 }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((n) => (
            <article
              key={n.id}
              style={{
                background: "var(--eq-bg-surface)",
                border: "1px solid var(--eq-border-default)",
                borderRadius: "var(--eq-radius-admin-card)",
                padding: "14px 16px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "var(--eq-bg-surface-soft)",
                  color: "var(--eq-primary-admin)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bell size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <strong style={{ fontSize: 15, color: "var(--eq-text-admin-primary)" }}>{n.title}</strong>
                  <span style={{ fontSize: 11, color: "var(--eq-text-admin-muted)" }}>{n.timeLabel}</span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--eq-text-secondary)", lineHeight: 1.5 }}>
                  {n.body}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="eq-app-badge-pill" style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-admin)" }}>
                    {n.audience}
                  </span>
                  <span className="eq-app-badge-pill" style={{ background: "#f1f5f9", color: "var(--eq-text-admin-muted)" }}>
                    {n.scheduleLabel}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ResponsiveModalOrSheet
        open={composeOpen}
        title="Gửi thông báo mới"
        subtitle="Lưu vào IndexedDB và hiển thị tức thì trên bảng tin Admin"
        onClose={() => setComposeOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Lịch bảo trì định kỳ hệ thống"
              style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Nội dung</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nhập nội dung thông báo chi tiết..."
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--eq-border-default)", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Đối tượng nhận</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                style={{ width: "100%", height: 40, padding: "0 10px", borderRadius: 8, border: "1px solid var(--eq-border-default)", background: "#fff" }}
              >
                <option value="Tất cả người dùng">Tất cả người dùng</option>
                <option value="Học viên THPT">Học viên THPT</option>
                <option value="Sinh viên Đại học">Sinh viên Đại học</option>
                <option value="Giảng viên">Giảng viên</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Thời điểm gửi</label>
              <select
                value={scheduleLabel}
                onChange={(e) => setScheduleLabel(e.target.value)}
                style={{ width: "100%", height: 40, padding: "0 10px", borderRadius: 8, border: "1px solid var(--eq-border-default)", background: "#fff" }}
              >
                <option value="Gửi ngay">Gửi ngay</option>
                <option value="Lên lịch 08:00 ngày mai">Lên lịch 08:00 ngày mai</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="button" className="eq-app-btn-secondary" style={{ flex: 1 }} onClick={() => setComposeOpen(false)}>
              Hủy
            </button>
            <button
              type="button"
              className="eq-app-btn-primary"
              style={{ flex: 1, background: "var(--eq-primary-admin)" }}
              onClick={() => void handleSend()}
            >
              <Send size={15} />
              <span>Phát thông báo</span>
            </button>
          </div>
        </div>
      </ResponsiveModalOrSheet>
    </div>
  );
}
