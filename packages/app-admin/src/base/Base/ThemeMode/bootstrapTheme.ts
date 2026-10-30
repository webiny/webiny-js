import { THEME_KEY, THEME_VARIABLES_KEY } from "./useTheme.js";

/**
 * Reads the cached theme variables straight from `window.localStorage`, tolerating an optional
 * prefix added by the localStorage service (keys are stored as `<prefix>:webiny/theme-variables`).
 *
 * Reading the raw storage — rather than going through the localStorage service/DI — means the
 * persisted theme can be applied on reload regardless of service bootstrap or theme-registry
 * timing. Returns `null` when nothing is cached.
 */
export function readCachedThemeVariables(): Record<string, string> | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        let raw = window.localStorage.getItem(THEME_VARIABLES_KEY);

        if (raw === null) {
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                // The localStorage service prefixes keys with a tenant-scoped prefix, e.g.
                // `webiny/<projectId>/<tenant>:webiny/theme-variables`. Match any such variant.
                if (key && key.includes(THEME_VARIABLES_KEY)) {
                    raw = window.localStorage.getItem(key);
                    break;
                }
            }
        }

        return raw ? (JSON.parse(raw) as Record<string, string>) : null;
    } catch {
        return null;
    }
}

/**
 * Reads the selected theme id straight from `window.localStorage`, with the same prefix
 * tolerance as `readCachedThemeVariables`.
 *
 * Without this the id is only readable through the localStorage service, whose tenant-scoped
 * prefix is unresolved on the first render after a reload. The id then reads as "light", whose
 * variable map is empty, so `ThemeModeApplier` can never treat the registry as authoritative
 * and falls back to the cached variables on every load — pinning whatever token set existed
 * when the theme was first selected.
 */
export function readCachedThemeId(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        let raw = window.localStorage.getItem(THEME_KEY);

        if (raw === null) {
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                // `THEME_VARIABLES_KEY` starts with `THEME_KEY`, so it must be excluded here or
                // the variables blob would be read as the id.
                if (key && key.includes(THEME_KEY) && !key.includes(THEME_VARIABLES_KEY)) {
                    raw = window.localStorage.getItem(key);
                    break;
                }
            }
        }

        if (!raw) {
            return null;
        }

        // The service stores values JSON-encoded; a raw write would not be.
        try {
            const parsed = JSON.parse(raw) as unknown;
            return typeof parsed === "string" ? parsed : null;
        } catch {
            return raw;
        }
    } catch {
        return null;
    }
}
