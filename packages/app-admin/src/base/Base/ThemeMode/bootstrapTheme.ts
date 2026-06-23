import { THEME_VARIABLES_KEY } from "./useTheme.js";

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
