import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useUI } from "../../context/UIContext";
import { adminService } from "../../services/adminService";
import type { AdminDashboardKpiDto } from "../../types/admin";

/**
 * Figma Admin Screens 14 & 15:
 * Analytics Overview, Monthly Engagement & Subject Effectiveness Breakdown + CSV Export.
 */
export default function AdminAnalyticsPage() {
  const { pushToast } = useUI();
  const [kpi, setKpi] = useState<AdminDashboardKpiDto | null>(null);

  useEffect(() => {
    let active = true;
    void adminService.getDashboardKpis().then((res) => {
      if (active) setKpi(res);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleExportCsv = () => {
    if (!kpi) return;
    const rows = [
      ["Mon hoc", "Ty le dat yeu cau (%)"],
      ...kpi.subjectEffectiveness.map((s) => [s.subject, String(s.percent)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eduquiz-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ title: "Đã xuất báo cáo CSV", message: "File eduquiz-analytics.csv đã được tải xuống." });
  };

  if (!kpi) {
    return <div className="eq-app-skeleton" style={{ height: 300 }} />;
  }

  const maxVal = Math.max(...kpi.monthlyAttempts.map((m) => m.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Phân tích & Hiệu quả học tập
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-admin-muted)" }}>
            Tăng trưởng lượt làm bài theo tháng và mức độ hoàn thành theo từng môn học
          </p>
        </div>

        <button
          type="button"
          className="eq-app-btn-secondary"
          style={{ height: 38, padding: "0 14px", fontSize: 13 }}
          onClick={handleExportCsv}
        >
          <Download size={15} />
          <span>Xuất CSV</span>
        </button>
      </div>

      <div className="eq-app-home-grid">
        {/* Monthly Attempts Chart */}
        <section
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Lượt thi 6 tháng gần nhất
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpi.monthlyAttempts.length}, 1fr)`, gap: 12, alignItems: "end", height: 220 }}>
            {kpi.monthlyAttempts.map((m, idx) => (
              <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
                  {m.value.toLocaleString("vi-VN")}
                </span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 46,
                    height: `${Math.max(16, Math.round((m.value / maxVal) * 100))}%`,
                    borderRadius: 6,
                    background: idx === kpi.monthlyAttempts.length - 1 ? "var(--eq-primary-admin)" : "#bfdbfe",
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--eq-text-admin-muted)" }}>{m.month}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Subject Effectiveness Breakdown */}
        <section
          style={{
            background: "var(--eq-bg-surface)",
            border: "1px solid var(--eq-border-default)",
            borderRadius: "var(--eq-radius-banner)",
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Tỉ lệ hoàn thành theo môn
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {kpi.subjectEffectiveness.map((s) => (
              <div key={s.subject}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: "var(--eq-text-admin-primary)" }}>{s.subject}</span>
                  <strong style={{ color: "var(--eq-primary-admin)" }}>{s.percent}%</strong>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: "var(--eq-bg-neutral-track)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.percent}%`, background: "var(--eq-primary-admin)", borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
