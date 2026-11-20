import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { useAdminConfig } from "~/config/AdminConfig.js";
import { lightTheme } from "~/config/AdminConfig/Theme/lightTheme.js";
import type { Theme } from "~/config/AdminConfig/Theme/types.js";
import { ThemeFeature } from "~/features/theme/feature.js";
import type { ThemeSelection } from "~/features/theme/abstractions.js";

export type ColorScheme = "light" | "dark";

export interface UseTheme {
    /** The selected theme id, or "light" when none has been selected. */
    theme: string;
    /** Selects and stores a theme. `ThemeModeApplier` applies it. */
    setTheme: (id: string) => void;
    /** All selectable themes: the built-in Light theme plus the ones registered via the extension. */
    themes: Theme[];
    /** The active theme's variables, without brand colors. */
    variables: Record<string, string>;
    /** "dark" when the active theme sets `--color-scheme: dark`, as `darkThemeBase` does. */
    colorScheme: ColorScheme;
}

// One object, so `ThemeModeApplier`'s effect doesn't re-run on every render.
const NO_VARIABLES: Record<string, string> = {};

interface StoredSelection {
    id: string | undefined;
    variables: Record<string, string> | undefined;
}

const readSelection = (selection: ThemeSelection.Interface): StoredSelection => {
    return { id: selection.getThemeId(), variables: selection.getStoredVariables() };
};

/**
 * The selectable themes (built-in Light plus any registered via `<AdminConfig.Theme.Register>`)
 * and the theme selected in this browser.
 *
 * A registered theme's own variables win over the stored copy. The stored copy covers the first
 * renders after a reload, before the extension that registers the theme has rendered.
 */
export const useTheme = (): UseTheme => {
    const { themes: registeredThemes } = useAdminConfig();
    const { selection } = useFeature(ThemeFeature);
    const [stored, setStored] = useState(() => readSelection(selection));

    useEffect(() => {
        return autorun(() => {
            const next = readSelection(selection);
            setStored(next);
        });
    }, [selection]);

    const themes = useMemo<Theme[]>(() => [lightTheme, ...registeredThemes], [registeredThemes]);

    const theme = stored.id ?? lightTheme.id;
    const registered = themes.find(t => t.id === theme);
    const variables = registered?.variables ?? stored.variables ?? NO_VARIABLES;
    const colorScheme: ColorScheme = variables["--color-scheme"] === "dark" ? "dark" : "light";

    const setTheme = useCallback(
        (id: string) => {
            const next = themes.find(t => t.id === id) ?? lightTheme;
            selection.select(next);
        },
        [selection, themes]
    );

    return { theme, setTheme, themes, variables, colorScheme };
};
