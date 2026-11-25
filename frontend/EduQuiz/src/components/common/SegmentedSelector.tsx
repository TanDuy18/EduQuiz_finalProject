interface SegmentOption<T extends string | number> {
  label: string;
  value: T;
}

interface SegmentedSelectorProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** Figma Component Sets `SoLuong` (281:1474) & `Độ khó` (281:1657) */
export default function SegmentedSelector<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedSelectorProps<T>) {
  return (
    <div
      className="eq-app-segment"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            className={`eq-app-segment-btn ${active ? "active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
