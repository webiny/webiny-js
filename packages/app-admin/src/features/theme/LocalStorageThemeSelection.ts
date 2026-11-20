import { LocalStorage } from "@webiny/app/features/localStorage";
import type { Theme } from "~/config/AdminConfig/Theme/types.js";
import { ThemeSelection } from "./abstractions.js";

const THEME_KEY = "webiny/theme";
const THEME_VARIABLES_KEY = "webiny/theme-variables";

/**
 * Keeps the selection in the root container's local storage, whose prefix is the deployment
 * alone. The theme is a per-browser preference, so it is the same in every tenant, and that
 * storage is readable on the first render, before a tenant has been resolved.
 */
class LocalStorageThemeSelectionImpl implements ThemeSelection.Interface {
    constructor(private localStorage: LocalStorage.Interface) {}

    getThemeId() {
        return this.localStorage.get<string>(THEME_KEY);
    }

    getStoredVariables() {
        return this.localStorage.get<Record<string, string>>(THEME_VARIABLES_KEY);
    }

    select(theme: Theme) {
        if (this.getThemeId() !== theme.id) {
            this.localStorage.set(THEME_KEY, theme.id);
        }

        const storedVariables = this.getStoredVariables();
        const stored = JSON.stringify(storedVariables);
        if (stored !== JSON.stringify(theme.variables)) {
            this.localStorage.set(THEME_VARIABLES_KEY, theme.variables);
        }
    }
}

export const LocalStorageThemeSelection = ThemeSelection.createImplementation({
    implementation: LocalStorageThemeSelectionImpl,
    dependencies: [LocalStorage]
});
