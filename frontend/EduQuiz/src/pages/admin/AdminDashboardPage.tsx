import {
  ArrowRight,
  BarChart3,
  Bell,
  FileQuestion,
  Flag,
  GraduationCap,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";
import type { AdminAuditLogRecord, AdminDashboardKpiDto } from "../../types/admin";

/**
 * Figma Admin Screens 01 & 02 (`iPhone Air - 1/2`, `354:3207`)
 * Responsive KPI Overview, Monthly Attempts Chart, Quick Admin Modules & Recent Activity.
 */
export default function AdminDashboardPage() {
  const [kpi, setKpi] = useState<AdminDashboardKpiDto | null>(null);
  const [logs, setLogs] = useState<AdminAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void Promise.all([
      adminService.getDashboardKpis(),
      adminService.getAuditLogs({ page: 1, size: 5 }),
    ]).then(([kpiRes, logRes]) => {
      if (!active) return;
      setKpi(kpiRes);
      setLogs(logRes.items);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading || !kpi) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="eq-app-skeleton" style={{ height: 110 }} />
        <div className="eq-app-skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  const maxMonthly = Math.max(...kpi.monthlyAttempts.map((m) => m.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Tổng quan hệ thống EduQuiz
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-admin-muted)" }}>
            Số liệu tổng hợp học viên, giảng viên, ngân hàng câu hỏi và hàng đợi báo lỗi
          </p>
        </div>

        <Link
          to="/admin/reports"
          className="eq-app-btn-primary"
          style={{
            height: 38,
            padding: "0 14px",
            fontSize: 13,
            background: "var(--eq-primary-admin)",
            textDecoration: "none",
          }}
        >
          <Flag size={15} />
          <span>Xử lý {kpi.pendingReports} báo cáo</span>
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        <div
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--eq-text-admin-muted)" }}>Tổng người dùng</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--eq-status-success-admin)",
                background: "#e7f7ef",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              {kpi.userGrowthPercent}
            </span>
          </div>
          <div style={{ fontSize: 27, fontWeight: 800, color: "var(--eq-text-admin-primary)" }}>
            {kpi.totalUsers.toLocaleString("vi-VN")}
          </div>
          <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)", marginTop: 4 }}>
            Hoạt động: {kpi.activeUsers.toLocaleString("vi-VN")} · Bị khóa: {kpi.lockedUsers}
          </div>
        </div>

        <div
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--eq-text-admin-muted)" }}>Giảng viên</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--eq-status-success-admin)",
                background: "#e7f7ef",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              {kpi.lecturerGrowthPercent}
            </span>
          </div>
          <div style={{ fontSize: 27, fontWeight: 800, color: "var(--eq-text-admin-primary)" }}>
            {kpi.totalLecturers.toLocaleString("vi-VN")}
          </div>
          <div style={{ fontSize: 12, color: "var(--eq-status-warning-admin)", fontWeight: 600, marginTop: 4 }}>
            {kpi.pendingLecturers} hồ sơ chờ duyệt
          </div>
        </div>

        <div
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--eq-text-admin-muted)" }}>Báo cáo câu hỏi sai</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--eq-status-danger-admin)",
                background: "var(--eq-status-danger-bg-admin)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              {kpi.priorityReports} ưu tiên
            </span>
          </div>
          <div style={{ fontSize: 27, fontWeight: 800, color: "var(--eq-status-danger-admin)" }}>
            {kpi.pendingReports}
          </div>
          <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)", marginTop: 4 }}>
            Đang chờ kiểm duyệt viên xử lý
          </div>
        </div>

        <div
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--eq-text-admin-muted)" }}>Ngân hàng câu hỏi</span>
            <FileQuestion size={16} color="var(--eq-primary-admin)" />
          </div>
          <div style={{ fontSize: 27, fontWeight: 800, color: "var(--eq-text-admin-primary)" }}>
            {kpi.totalQuestions.toLocaleString("vi-VN")}
          </div>
          <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)", marginTop: 4 }}>
            Phân bổ trên 24 môn học chuẩn
          </div>
        </div>
      </div>

      {/* Main Split: Monthly Attempts Chart + Quick Access */}
      <div className="eq-app-home-grid">
        <section
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
                Lượt làm bài theo tháng
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--eq-text-admin-muted)" }}>
                Thống kê 6 tháng gần nhất (Figma Reference KPI)
              </p>
            </div>
            <Link
              to="/admin/analytics"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--eq-primary-admin)", textDecoration: "none" }}
            >
              Xem phân tích
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${kpi.monthlyAttempts.length}, 1fr)`,
              gap: 12,
              alignItems: "end",
              height: 190,
              paddingTop: 12,
            }}
          >
            {kpi.monthlyAttempts.map((item, idx) => {
              const hPct = Math.max(18, Math.round((item.value / maxMonthly) * 100));
              const isLatest = idx === kpi.monthlyAttempts.length - 1;
              return (
                <div
                  key={item.month}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: isLatest ? "var(--eq-primary-admin)" : "var(--eq-text-admin-muted)" }}>
                    {(item.value / 1000).toFixed(1)}k
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 42,
                      height: `${hPct}%`,
                      borderRadius: "var(--eq-radius-2xs)",
                      background: isLatest ? "var(--eq-primary-admin)" : "var(--eq-bg-surface-soft)",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "var(--eq-text-admin-muted)" }}>{item.month}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Modules Menu */}
        <section
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 18,
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Truy cập nhanh
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { to: "/admin/users", icon: Users, label: "Quản lý học viên" },
              { to: "/admin/lecturers", icon: GraduationCap, label: "Duyệt hồ sơ giảng viên" },
              { to: "/admin/questions", icon: FileQuestion, label: "Ngân hàng câu hỏi" },
              { to: "/admin/reports", icon: Flag, label: "Báo cáo câu hỏi sai" },
              { to: "/admin/analytics", icon: BarChart3, label: "Phân tích hiệu quả môn" },
              { to: "/admin/notifications", icon: Bell, label: "Gửi thông báo hệ thống" },
              { to: "/admin/settings", icon: Settings, label: "Cấu hình hệ thống" },
              { to: "/admin/security", icon: ShieldCheck, label: "Bảo mật & Nhật ký" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: "var(--eq-radius-md)",
                    background: "var(--eq-bg-admin-android)",
                    textDecoration: "none",
                    color: "var(--eq-text-admin-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <Icon size={16} color="var(--eq-primary-admin)" />
                    <span>{item.label}</span>
                  </span>
                  <ArrowRight size={14} color="var(--eq-text-admin-muted)" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recent Audit Activity */}
      <section
        style={{
          background: "var(--eq-bg-surface)",
          border: "1px solid var(--eq-border-default)",
          borderRadius: "var(--eq-radius-banner)",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Hoạt động quản trị gần đây
          </h2>
          <Link
            to="/admin/security"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--eq-primary-admin)", textDecoration: "none" }}
          >
            Xem nhật ký
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 12px",
                borderRadius: "var(--eq-radius-md)",
                background: "var(--eq-bg-admin-android)",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--eq-text-admin-primary)" }}>
                  {log.action}
                </div>
                <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)" }}>
                  {log.actorEmail} · {log.timestampLabel}
                </div>
              </div>
              <span
                className="eq-app-badge-pill"
                style={{
                  background:
                    log.statusTone === "danger"
                      ? "var(--eq-status-danger-bg-admin)"
                      : log.statusTone === "warning"
                        ? "#fff4db"
                        : "var(--eq-bg-surface-soft)",
                  color:
                    log.statusTone === "danger"
                      ? "var(--eq-status-danger-admin)"
                      : log.statusTone === "warning"
                        ? "var(--eq-status-warning-text)"
                        : "var(--eq-primary-admin)",
                }}
              >
                {log.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
