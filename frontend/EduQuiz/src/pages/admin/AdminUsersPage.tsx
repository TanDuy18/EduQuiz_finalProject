import { Check, Lock, Search, Unlock, UserCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import ResponsiveModalOrSheet from "../../components/common/ResponsiveModalOrSheet";
import { useUI } from "../../context/UIContext";
import { useDebounce } from "../../hooks/useDebounce";
import { adminService } from "../../services/adminService";
import type { AccountStatus, AdminLecturerRecord, AdminUserRecord } from "../../types/admin";

interface AdminUsersPageProps {
  initialTab?: "USERS" | "LECTURERS";
}

/**
 * Figma Admin Screens 03–07:
 * User List, User Status Filter, User Detail & Edit Modal, Lecturer Directory & Approval Detail.
 */
export default function AdminUsersPage({ initialTab = "USERS" }: AdminUsersPageProps) {
  const { pushToast } = useUI();
  const [tab, setTab] = useState<"USERS" | "LECTURERS">(initialTab);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [lecturers, setLecturers] = useState<AdminLecturerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [inspectLecturer, setInspectLecturer] = useState<AdminLecturerRecord | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (tab === "USERS") {
      void adminService
        .getUsers({ page: 1, size: 50, search: debouncedSearch, status: statusFilter })
        .then((res) => {
          if (!active) return;
          setUsers(res.items);
          setLoading(false);
        });
    } else {
      void adminService
        .getLecturers({
          page: 1,
          size: 50,
          search: debouncedSearch,
          approvalStatus: statusFilter === "Tất cả" ? "ALL" : statusFilter,
        })
        .then((res) => {
          if (!active) return;
          setLecturers(res.items);
          setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [tab, debouncedSearch, statusFilter, reloadTick]);

  const handleSaveUser = async () => {
    if (!editingUser) return;
    await adminService.updateUser(editingUser.id, editingUser);
    pushToast({
      title: "Đã cập nhật người dùng",
      message: `Hồ sơ ${editingUser.fullName} đã được lưu vào IndexedDB.`,
    });
    setEditingUser(null);
    setReloadTick((t) => t + 1);
  };

  const handleToggleLock = async (user: AdminUserRecord) => {
    const nextStatus: AccountStatus = user.status === "LOCKED" ? "ACTIVE" : "LOCKED";
    await adminService.updateUser(user.id, { status: nextStatus });
    pushToast({
      title: nextStatus === "LOCKED" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      message: `${user.fullName} (${user.code}) -> ${nextStatus}`,
    });
    setReloadTick((t) => t + 1);
  };

  const handleLecturerDecision = async (lec: AdminLecturerRecord, approved: boolean) => {
    await adminService.approveLecturer(lec.id, approved);
    pushToast({
      title: approved ? "Đã phê duyệt giảng viên" : "Đã từ chối hồ sơ",
      message: `${lec.fullName} (${lec.specialty})`,
    });
    setInspectLecturer(null);
    setReloadTick((t) => t + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--eq-text-admin-primary)" }}>
            Quản lý tài khoản
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-admin-muted)" }}>
            Quản trị học viên, trạng thái hoạt động và xét duyệt hồ sơ giảng viên
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setTab("USERS");
              setStatusFilter("Tất cả");
            }}
            style={{
              border: "none",
              borderRadius: "var(--eq-radius-md)",
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              background: tab === "USERS" ? "var(--eq-primary-admin)" : "var(--eq-bg-surface)",
              color: tab === "USERS" ? "#fff" : "var(--eq-text-admin-muted)",
            }}
          >
            Học viên
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("LECTURERS");
              setStatusFilter("Tất cả");
            }}
            style={{
              border: "none",
              borderRadius: "var(--eq-radius-md)",
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              background: tab === "LECTURERS" ? "var(--eq-primary-admin)" : "var(--eq-bg-surface)",
              color: tab === "LECTURERS" ? "#fff" : "var(--eq-text-admin-muted)",
            }}
          >
            Giảng viên
          </button>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div className="eq-app-search-box" style={{ flex: 1, minWidth: 220, height: 42, boxShadow: "none" }}>
          <Search size={17} color="var(--eq-text-admin-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "USERS" ? "Tìm theo tên, email, mã HV..." : "Tìm giảng viên, chuyên môn..."}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(tab === "USERS"
            ? [
                { val: "Tất cả", label: "Tất cả" },
                { val: "ACTIVE", label: "Hoạt động" },
                { val: "LOCKED", label: "Bị khóa" },
                { val: "PENDING", label: "Chờ kích hoạt" },
              ]
            : [
                { val: "Tất cả", label: "Tất cả" },
                { val: "PENDING", label: "Chờ duyệt" },
                { val: "APPROVED", label: "Đã duyệt" },
                { val: "REJECTED", label: "Từ chối" },
              ]
          ).map((f) => (
            <button
              key={f.val}
              type="button"
              onClick={() => setStatusFilter(f.val)}
              style={{
                border: "1px solid var(--eq-border-default)",
                borderRadius: "var(--eq-radius-full)",
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: statusFilter === f.val ? "var(--eq-bg-surface-soft)" : "var(--eq-bg-surface)",
                color: statusFilter === f.val ? "var(--eq-primary-admin)" : "var(--eq-text-admin-muted)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="eq-app-skeleton" style={{ height: 220 }} />
      ) : tab === "USERS" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map((u) => (
            <article
              key={u.id}
              style={{
                background: "var(--eq-bg-surface)",
                border: "1px solid var(--eq-border-default)",
                borderRadius: "var(--eq-radius-admin-card)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 15, color: "var(--eq-text-admin-primary)" }}>{u.fullName}</strong>
                  <span style={{ fontSize: 11, color: "var(--eq-text-admin-muted)" }}>({u.code})</span>
                  <span
                    className="eq-app-badge-pill"
                    style={{
                      background:
                        u.status === "ACTIVE"
                          ? "#e7f7ef"
                          : u.status === "LOCKED"
                            ? "var(--eq-status-danger-bg-admin)"
                            : "#fff4db",
                      color:
                        u.status === "ACTIVE"
                          ? "var(--eq-status-success-admin)"
                          : u.status === "LOCKED"
                            ? "var(--eq-status-danger-admin)"
                            : "var(--eq-status-warning-text)",
                    }}
                  >
                    {u.status === "ACTIVE" ? "Hoạt động" : u.status === "LOCKED" ? "Đã khóa" : "Chờ duyệt"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)" }}>
                  {u.email} · {u.groupLabel} · {u.school} · {u.completedQuizzes} đề đã làm
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="eq-app-btn-secondary"
                  style={{ height: 34, padding: "0 12px", fontSize: 12 }}
                  onClick={() => setEditingUser(u)}
                >
                  Chi tiết / Sửa
                </button>
                <button
                  type="button"
                  className="eq-app-btn-secondary"
                  style={{
                    height: 34,
                    padding: "0 10px",
                    fontSize: 12,
                    color: u.status === "LOCKED" ? "var(--eq-status-success-admin)" : "var(--eq-status-danger-admin)",
                  }}
                  onClick={() => void handleToggleLock(u)}
                >
                  {u.status === "LOCKED" ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>{u.status === "LOCKED" ? "Mở khóa" : "Khóa"}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lecturers.map((lec) => (
            <article
              key={lec.id}
              style={{
                background: "var(--eq-bg-surface)",
                border: "1px solid var(--eq-border-default)",
                borderRadius: "var(--eq-radius-admin-card)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 15, color: "var(--eq-text-admin-primary)" }}>{lec.fullName}</strong>
                  <span
                    className="eq-app-badge-pill"
                    style={{
                      background:
                        lec.approvalStatus === "APPROVED"
                          ? "#e7f7ef"
                          : lec.approvalStatus === "REJECTED"
                            ? "var(--eq-status-danger-bg-admin)"
                            : "#fff4db",
                      color:
                        lec.approvalStatus === "APPROVED"
                          ? "var(--eq-status-success-admin)"
                          : lec.approvalStatus === "REJECTED"
                            ? "var(--eq-status-danger-admin)"
                            : "var(--eq-status-warning-text)",
                    }}
                  >
                    {lec.approvalStatus === "APPROVED"
                      ? "Đã duyệt"
                      : lec.approvalStatus === "REJECTED"
                        ? "Đã từ chối"
                        : "Chờ xét duyệt"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--eq-text-admin-muted)" }}>
                  {lec.specialty} · {lec.institution} · {lec.experienceYears} năm KN · {lec.contributedQuizzes} đề đóng góp
                </div>
              </div>

              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ height: 34, padding: "0 12px", fontSize: 12, background: "var(--eq-primary-admin)" }}
                onClick={() => setInspectLecturer(lec)}
              >
                <UserCheck size={14} />
                <span>Xem hồ sơ</span>
              </button>
            </article>
          ))}
        </div>
      )}

      {/* User Edit Modal */}
      <ResponsiveModalOrSheet
        open={Boolean(editingUser)}
        title="Chỉnh sửa thông tin học viên"
        subtitle={editingUser ? `${editingUser.code} · ${editingUser.email}` : undefined}
        onClose={() => setEditingUser(null)}
      >
        {editingUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Họ và tên</label>
              <input
                type="text"
                value={editingUser.fullName}
                onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Nhóm cấp học</label>
              <input
                type="text"
                value={editingUser.groupLabel}
                onChange={(e) => setEditingUser({ ...editingUser, groupLabel: e.target.value })}
                style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Trường học</label>
              <input
                type="text"
                value={editingUser.school}
                onChange={(e) => setEditingUser({ ...editingUser, school: e.target.value })}
                style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid var(--eq-border-default)" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="button" className="eq-app-btn-secondary" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>
                Hủy
              </button>
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ flex: 1, background: "var(--eq-primary-admin)" }}
                onClick={() => void handleSaveUser()}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}
      </ResponsiveModalOrSheet>

      {/* Lecturer Approval Modal */}
      <ResponsiveModalOrSheet
        open={Boolean(inspectLecturer)}
        title="Hồ sơ giảng viên"
        subtitle={inspectLecturer?.code}
        onClose={() => setInspectLecturer(null)}
      >
        {inspectLecturer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, lineHeight: 1.65 }}>
              <div><strong>Họ tên:</strong> {inspectLecturer.fullName}</div>
              <div><strong>Email:</strong> {inspectLecturer.email}</div>
              <div><strong>Chuyên môn:</strong> {inspectLecturer.specialty}</div>
              <div><strong>Đơn vị công tác:</strong> {inspectLecturer.institution}</div>
              <div><strong>Kinh nghiệm:</strong> {inspectLecturer.experienceYears} năm</div>
              <div><strong>Số bộ đề đóng góp:</strong> {inspectLecturer.contributedQuizzes}</div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="eq-app-btn-secondary"
                style={{ flex: 1, color: "var(--eq-status-danger-admin)" }}
                onClick={() => void handleLecturerDecision(inspectLecturer, false)}
              >
                <X size={16} />
                <span>Từ chối</span>
              </button>
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ flex: 1, background: "var(--eq-status-success-admin)" }}
                onClick={() => void handleLecturerDecision(inspectLecturer, true)}
              >
                <Check size={16} />
                <span>Phê duyệt</span>
              </button>
            </div>
          </div>
        )}
      </ResponsiveModalOrSheet>
    </div>
  );
}
