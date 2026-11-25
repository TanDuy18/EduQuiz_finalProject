import type { ReactNode } from "react";

interface ResponsiveModalOrSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function ResponsiveModalOrSheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: ResponsiveModalOrSheetProps) {
  if (!open) return null;

  return (
    <div
      className="eq-app-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="eq-app-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: "var(--eq-font-heading)",
                fontSize: 20,
                fontWeight: "var(--eq-weight-bold)",
                color: "var(--eq-text-primary)",
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--eq-text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--eq-primary-action)",
              fontSize: 14,
              fontWeight: 600,
              padding: "4px 8px",
            }}
          >
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
