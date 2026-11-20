import { useTheme } from "./useTheme.js";
import type { ColorScheme } from "./useTheme.js";

export type { ColorScheme };

/**
 * Whether the active theme is light or dark, for things CSS variables cannot reach: a Monaco
 * editor, a charting library, an embedded iframe, a canvas. Read from the theme's
 * `--color-scheme` variable, the same value that sets `color-scheme` on `<html>`.
 */
export const useColorScheme = (): ColorScheme => {
    return useTheme().colorScheme;
};
