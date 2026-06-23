import { useLocalStorage } from "@webiny/app";
import { useTheme, THEME_VARIABLES_KEY } from "./useTheme.js";
import { applyTheme } from "./applyTheme.js";
import { readCachedThemeVariables } from "./bootstrapTheme.js";

/**
 * Applies the selected theme's CSS variables to `<html>` during render (before paint, like
 * `AdminConfig/Theme/assignColor.ts`), so it isn't subject to effect-timing races.
 *
 * On the first render after a reload, neither the localStorage service (its key prefix is
 * tenant-scoped and not yet resolved) nor the theme registry (populated by the extension) is
 * ready — so the persisted selection must come from the variables cached at selection time,
 * read via a prefix-tolerant scan of `window.localStorage`. Once the registry has resolved the
 * selected theme, its definition is canonical and takes over.
 *
 * The built-in "light" theme has no variables, so when light is genuinely selected the cache is
 * `{}` and `applyTheme` simply clears the overrides. Renders nothing.
 */
export const ThemeModeApplier = () => {
    const { theme, themes } = useTheme();
    const { get } = useLocalStorage();

    // Variables cached when the theme was selected. Prefer the (prefix-aware) localStorage
    // service, but fall back to a direct scan: the service prefix isn't resolved on the first
    // render after reload, so it returns nothing then.
    const cached = get<Record<string, string>>(THEME_VARIABLES_KEY) ?? readCachedThemeVariables();

    // The registry is authoritative once it has resolved the selected theme with real variables.
    // Until then (or when the stored id can't be read yet, falling back to variable-less light),
    // apply the cached variables — this is what makes the persisted theme survive a reload.
    const registered = themes.find(t => t.id === theme);
    const registeredVariables =
        registered && Object.keys(registered.variables).length > 0 ? registered.variables : null;

    applyTheme(registeredVariables ?? cached ?? {});

    return null;
};
