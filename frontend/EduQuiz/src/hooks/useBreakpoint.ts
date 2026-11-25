import { useEffect, useState } from "react";

export type Breakpoint = "MOBILE" | "TABLET" | "DESKTOP";

function computeBreakpoint(width: number): Breakpoint {
  if (width >= 1024) return "DESKTOP";
  if (width >= 768) return "TABLET";
  return "MOBILE";
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    typeof window === "undefined" ? "DESKTOP" : computeBreakpoint(window.innerWidth),
  );

  useEffect(() => {
    const onResize = () => setBreakpoint(computeBreakpoint(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === "MOBILE",
    isTablet: breakpoint === "TABLET",
    isDesktop: breakpoint === "DESKTOP",
  };
}
