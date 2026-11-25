import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import iconInfo from "../assets/figma/icon-info.png";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  timeLabel?: string;
}

interface UIContextValue {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 3));
      window.setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

  return (
    <UIContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="eq-app-toast-stack" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="eq-app-toast-card" onClick={() => dismissToast(t.id)}>
              <img src={iconInfo} alt="" width={25} height={25} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 15, fontFamily: "var(--eq-font-heading)", color: "var(--eq-text-black)" }}>
                    {t.title}
                  </strong>
                  <span style={{ fontSize: 10, color: "var(--eq-text-timestamp)" }}>
                    {t.timeLabel ?? "Vừa xong"}
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--eq-text-secondary)", lineHeight: 1.4 }}>
                  {t.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}
