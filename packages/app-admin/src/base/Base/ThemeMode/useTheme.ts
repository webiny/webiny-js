import { useCallback } from "react";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";

export const THEME_KEY = "webiny/theme";
export const DEFAULT_THEME = "light";

export interface ThemeOption {
    id: string;
    label: string;
}

/**
 * Available admin UI themes. "light" is the default; the rest are dark themes activated by
 * setting `data-theme="<id>"` on <html> — each id has a matching block in @webiny/admin-ui
 * `theme.css`. Add a theme here and a palette there to introduce a new one.
 */
export const THEMES: ThemeOption[] = [
    { id: "light", label: "Light" },
    { id: "webiny-dark", label: "Webiny Dark" },
    { id: "dracula", label: "Dracula" },
    { id: "github-dark", label: "GitHub Dark" },
    { id: "one-dark-pro", label: "One Dark Pro" },
    { id: "tokyo-night", label: "Tokyo Night" },
    { id: "catppuccin-mocha", label: "Catppuccin Mocha" }
];

export interface UseTheme {
    theme: string;
    setTheme: (id: string) => void;
    themes: ThemeOption[];
}

/**
 * Reads and persists the selected admin UI theme in local storage. The value is stored as a
 * plain theme id string; reads are reactive via `useLocalStorageValue`, so consumers (the
 * applier and the sidebar switcher) re-render when the theme changes.
 */
export const useTheme = (): UseTheme => {
    const stored = useLocalStorageValue<string>(THEME_KEY);
    const { set } = useLocalStorage();

    const theme = THEMES.some(t => t.id === stored) ? (stored as string) : DEFAULT_THEME;

    const setTheme = useCallback(
        (id: string) => {
            set(THEME_KEY, id);
            // Apply immediately and synchronously. Persisting + relying on the reactive
            // `ThemeModeApplier` is enough on reload, but applying here guarantees the click
            // takes effect right away regardless of cross-component store propagation.
            if (typeof document !== "undefined") {
                document.documentElement.setAttribute("data-theme", id);
            }
        },
        [set]
    );

    return { theme, setTheme, themes: THEMES };
};
