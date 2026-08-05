import type { ActiveTheme, ThemeLinkTag, ThemeSdkConfig } from "./types.js";

/**
 * The frontend client for a published Webiny theme — see the Theme design brief, section 8.
 *
 * Its single job is to close the one missing link between producer and consumer: a published page
 * already emits `var(--wby-*, fallback)` inline on every element, so all a theme has to do is get its
 * `tokens.css` (which defines those variables on `:root`) onto the page. This client resolves the
 * active theme at SSR and hands a layout the `<link>` it should render in `<head>`.
 *
 * Deliberately framework-agnostic and dependency-free: the same client serves Next.js, Nuxt, a plain
 * React app, and the Tailwind adapter. Injection into `<head>` is the framework host's job, because the
 * document renderer owns no `<head>`.
 */

/**
 * Public path of the active-theme resolution route.
 *
 * This is the stable HTTP contract with the backend. It MUST match `ACTIVE_THEME_ROUTE` in
 * `@webiny/api-theme`'s constants; it is duplicated rather than imported so this client stays free of
 * the API package's dependency graph. A public URL path changes far less often than an internal
 * constant, but if that route ever moves, both ends change together.
 */
export const ACTIVE_THEME_PATH = "/_webiny/theme/active";

/**
 * Ceiling on the active-theme request.
 *
 * SSR must never hang on theme resolution — a page that renders unthemed is a far better failure than
 * a page that never renders. The active pointer is a tiny, CDN-cached JSON, so this is generous.
 */
export const DEFAULT_TIMEOUT_MS = 5000;

interface ActiveThemeResponse {
    active: boolean;
    themeId?: string;
    version?: number;
    activatedOn?: string;
    artifacts?: { css?: string; json?: string };
}

export class ThemeSdk {
    private readonly apiHost: string;
    private readonly apiKey?: string;
    private readonly apiTenant?: string;
    private readonly fetchImpl: typeof fetch;
    private readonly timeoutMs: number;

    constructor(config: ThemeSdkConfig) {
        // Trailing slash stripped once, so every URL join below is a clean concatenation.
        this.apiHost = config.apiHost.replace(/\/+$/, "");
        this.apiKey = config.apiKey;
        this.apiTenant = config.apiTenant;
        this.fetchImpl = config.fetch ?? globalThis.fetch;
        this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    }

    /**
     * Resolves the tenant's active, published theme, or `null` when there is none.
     *
     * `null` is a first-class, expected result — a project that has not opted into themes, a fetch that
     * timed out, a transient 5xx. None of these may throw: a themeless site must render normally. The
     * caller renders no theme `<link>` and every `var(--wby-*)` falls back to its captured value.
     */
    async getActiveTheme(): Promise<ActiveTheme | null> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await this.fetchImpl(`${this.apiHost}${ACTIVE_THEME_PATH}`, {
                headers: this.authHeaders(),
                signal: controller.signal
            });

            if (!response.ok) {
                return null;
            }

            const body = (await response.json()) as ActiveThemeResponse;

            // `{ active: false }` is the backend's explicit "no theme" answer (a 200, not a 404). A
            // malformed body missing the pieces we need is treated the same way rather than trusted.
            if (
                !body.active ||
                !body.themeId ||
                typeof body.version !== "number" ||
                !body.artifacts?.css ||
                !body.artifacts?.json
            ) {
                return null;
            }

            return {
                themeId: body.themeId,
                version: body.version,
                activatedOn: body.activatedOn ?? "",
                artifacts: {
                    css: this.toAbsolute(body.artifacts.css),
                    json: this.toAbsolute(body.artifacts.json)
                }
            };
        } catch {
            // Network error, abort/timeout, or non-JSON body. Themeless, never thrown.
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    private authHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};
        if (this.apiKey) {
            headers["authorization"] = `Bearer ${this.apiKey}`;
        }
        if (this.apiTenant) {
            headers["x-tenant"] = this.apiTenant;
        }
        return headers;
    }

    /**
     * Resolves the route's relative artifact path to an absolute URL on the API host.
     *
     * The route returns relative paths (`/_webiny/theme/<id>/<v>/tokens.css`) on the assumption of a
     * same-origin `/_webiny/theme/*` rewrite. That rewrite is a later optimisation; until it exists, an
     * absolute URL on the API host makes the browser `<link>` resolve immediately. An already-absolute
     * URL is passed through, so a future rewrite that emits absolute URLs is unaffected.
     */
    private toAbsolute(path: string): string {
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        return `${this.apiHost}${path.startsWith("/") ? "" : "/"}${path}`;
    }
}

/**
 * The `<head>` tags a layout renders to apply the theme.
 *
 * Pure and framework-agnostic: Next.js, Nuxt and plain React all map this to their own head mechanism.
 * Returns an empty array for a themeless site, so a layout renders nothing extra.
 */
export const getThemeLinkTags = (active: ActiveTheme | null): ThemeLinkTag[] => {
    if (!active) {
        return [];
    }

    return [{ rel: "stylesheet", href: active.artifacts.css }];
};
