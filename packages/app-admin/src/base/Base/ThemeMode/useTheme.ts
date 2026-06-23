import { useCallback, useMemo } from "react";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";
import { useAdminConfig } from "~/config/AdminConfig.js";
import { lightTheme } from "~/config/AdminConfig/Theme/lightTheme.js";
import type { Theme } from "~/config/AdminConfig/Theme/types.js";
import { applyTheme } from "./applyTheme.js";

export const THEME_KEY = "webiny/theme";
/**
 * The selected theme's CSS variables are cached here so the applier can re-apply them
 * immediately on load, without waiting for the theme registry (extension) to populate.
 */
export const THEME_VARIABLES_KEY = "webiny/theme-variables";
export const DEFAULT_THEME = lightTheme.id;

export interface UseTheme {
    /** The selected theme id (from local storage, or "light" by default). */
    theme: string;
    /** Persist the selection and apply it immediately. */
    setTheme: (id: string) => void;
    /** All selectable themes: the built-in Light theme plus the ones registered via the extension. */
    themes: Theme[];
}

/**
 * Reads the registered themes (built-in Light + any registered via
 * `<AdminConfig.Theme.Register>`) and the selected theme id from local storage. Selection is
 * persisted under `webiny/theme`; with nothing stored, Light is used. `setTheme` persists and
 * applies immediately, while `ThemeModeApplier` applies on load and reactively.
 */
export const useTheme = (): UseTheme => {
    const { themes: registeredThemes } = useAdminConfig();
    const storedTheme = useLocalStorageValue<string>(THEME_KEY);
    const { set } = useLocalStorage();

    const themes = useMemo<Theme[]>(() => [lightTheme, ...registeredThemes], [registeredThemes]);

    const theme = storedTheme || DEFAULT_THEME;

    const setTheme = useCallback(
        (id: string) => {
            const next = themes.find(t => t.id === id) ?? lightTheme;
            set(THEME_KEY, id);
            // Cache the resolved variables so a page reload can apply them without waiting for
            // the theme registry to re-populate.
            set(THEME_VARIABLES_KEY, next.variables);
            applyTheme(next.variables);
        },
        [set, themes]
    );

    return { theme, setTheme, themes };
};
