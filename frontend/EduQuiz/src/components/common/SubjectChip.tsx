export type SubjectTone =
  | "default"
  | "math"
  | "literature"
  | "physics"
  | "chemistry"
  | "english"
  | "history"
  | "other";

interface SubjectChipProps {
  label: string;
  selected?: boolean;
  tone?: SubjectTone;
  onClick?: () => void;
}

/** Figma Subject Filter Chips (174:209..235) */
export default function SubjectChip({
  label,
  selected = false,
  tone = "default",
  onClick,
}: SubjectChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`eq-app-chip tone-${tone} ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
