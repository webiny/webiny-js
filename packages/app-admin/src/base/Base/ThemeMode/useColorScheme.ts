import { useMemo } from "react";
import { useTheme } from "./useTheme.js";

export type ColorScheme = "light" | "dark";

/**
 * Whether the active theme is light or dark, for things CSS variables cannot reach — a Monaco
 * editor, a charting library, an embedded iframe, a canvas.
 *
 * Read from the `color-scheme` the theme puts on `<html>` (a dark theme sets
 * `--color-scheme: dark` via `darkThemeBase`) rather than from a flag on the theme object, so
 * it reflects what is actually applied and needs nothing extra from theme authors. Keyed on the
 * theme id so it re-evaluates when the theme changes.
 */
export const useColorScheme = (): ColorScheme => {
    const { theme } = useTheme();

    return useMemo<ColorScheme>(() => {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return "light";
        }

        // `color-scheme` can hold a list (e.g. "light dark"); "dark" alone is what a dark theme
        // resolves to, and the light default never contains it.
        return getComputedStyle(document.documentElement).colorScheme.trim() === "dark"
            ? "dark"
            : "light";
    }, [theme]);
};
