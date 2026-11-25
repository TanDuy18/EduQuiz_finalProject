import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { SubjectCategoryGroup, SubjectDto } from "../../types/quiz";
import ResponsiveModalOrSheet from "../common/ResponsiveModalOrSheet";
import SubjectChip from "../common/SubjectChip";

interface SubjectPickerModalProps {
  open: boolean;
  subjects: SubjectDto[];
  selectedIds: string[];
  onApply: (nextIds: string[]) => void;
  onClose: () => void;
}

const GROUP_TABS: { key: "ALL" | SubjectCategoryGroup; label: string }[] = [
  { key: "ALL", label: "Tất cả (24)" },
  { key: "NATURAL", label: "Tự nhiên" },
  { key: "SOCIAL", label: "Xã hội" },
  { key: "LANGUAGE", label: "Ngoại ngữ" },
  { key: "OTHER", label: "Khác" },
];

/** Figma `EduQuiz_ChonMon` (316:3438) — 24-subject Multi-Select Modal/Sheet */
export default function SubjectPickerModal({
  open,
  subjects,
  selectedIds,
  onApply,
  onClose,
}: SubjectPickerModalProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ALL" | SubjectCategoryGroup>("ALL");
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);

  // Sync draft when opening
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraftIds(selectedIds);
      setSearch("");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjects.filter((s) => {
      if (tab !== "ALL" && s.categoryGroup !== tab) return false;
      if (q && !`${s.name} ${s.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [subjects, tab, search]);

  const toggle = (id: string) => {
    setDraftIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <ResponsiveModalOrSheet
      open={open}
      title="Chọn môn học"
      subtitle={`Đã chọn ${draftIds.length} môn`}
      onClose={onClose}
    >
      <div className="eq-app-search-box" style={{ height: 42, marginBottom: 14, boxShadow: "none" }}>
        <Search size={18} color="var(--eq-text-muted)" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm môn học..."
        />
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
        {GROUP_TABS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setTab(g.key)}
            style={{
              border: "none",
              borderRadius: "var(--eq-radius-full)",
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: tab === g.key ? "var(--eq-primary-chip)" : "var(--eq-bg-surface-soft)",
              color: tab === g.key ? "#fff" : "var(--eq-primary-action)",
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 140, alignContent: "flex-start" }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--eq-text-muted)" }}>Không tìm thấy môn học phù hợp.</p>
        ) : (
          filtered.map((s) => (
            <SubjectChip
              key={s.id}
              label={s.name}
              tone={s.colorKey}
              selected={draftIds.includes(s.id)}
              onClick={() => toggle(s.id)}
            />
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          type="button"
          className="eq-app-btn-secondary"
          style={{ flex: 1 }}
          onClick={() => setDraftIds([])}
        >
          Bỏ chọn hết
        </button>
        <button
          type="button"
          className="eq-app-btn-primary"
          style={{ flex: 1, background: "var(--eq-primary-action)" }}
          onClick={() => {
            onApply(draftIds);
            onClose();
          }}
        >
          Xong ({draftIds.length})
        </button>
      </div>
    </ResponsiveModalOrSheet>
  );
}
