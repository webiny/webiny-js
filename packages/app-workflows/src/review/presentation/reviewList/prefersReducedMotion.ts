// Whether the viewer asked the system for reduced motion; `false` where `matchMedia` is missing.
export const prefersReducedMotion = (): boolean => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
