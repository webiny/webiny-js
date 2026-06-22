/**
 * @deprecated The light/dark toggle was replaced by a multi-theme switcher.
 * Use `useTheme` (and the `THEMES` registry) from "./useTheme.js" instead.
 * Kept as a thin re-export for backward compatibility.
 */
export {
    useTheme,
    useTheme as useThemeMode,
    THEMES,
    THEME_KEY,
    THEME_KEY as THEME_MODE_KEY
} from "./useTheme.js";
export type { ThemeOption, UseTheme } from "./useTheme.js";
