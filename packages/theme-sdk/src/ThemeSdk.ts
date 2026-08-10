import type {
    ThemeArtifactName,
    ThemeJson,
    ThemeLinkTag,
    ThemeNuxtRouteRules,
    ThemePreview,
    ThemeRewriteRule,
    ThemeSdkConfig
} from "./types.js";

/**
 * The frontend client for a published Webiny theme — see the design brief, section 6, and the change
 * brief, C7–C10.
 *
 * Delivery now serves whichever version is active at a stable, version-less URL with a short TTL, so
 * the client's job shrinks to almost nothing: emit a `<link>` to that fixed URL and a static
 * `preconnect` for the fonts the stylesheet's `@import` will load. No active-pointer fetch, no version
 * resolution, no revalidation wiring — the CDN's TTL is the whole activation mechanism.
 *
 * Framework-agnostic and dependency-free: the same client serves Next.js, Nuxt, a plain React app and
 * the Tailwind adapter. Injecting the tags into `<head>` is the framework host's job.
 */

/** The public path prefix every theme route lives under. The one place it is named on the consumer side. */
export const THEME_ROUTE_PREFIX = "/_webiny/theme";

/** Stable, version-less delivery paths. Delivery always serves the active version at these URLs (C7). */
export const THEME_ARTIFACT_PATHS: Readonly<Record<ThemeArtifactName, string>> = {
    css: `${THEME_ROUTE_PREFIX}/tokens.css`,
    json: `${THEME_ROUTE_PREFIX}/tokens.json`,
    manifest: `${THEME_ROUTE_PREFIX}/manifest.json`
};

const ARTIFACT_FILE: Readonly<Record<ThemeArtifactName, string>> = {
    css: "tokens.css",
    json: "tokens.json",
    manifest: "manifest.json"
};

export const GOOGLE_FONTS_STATIC_ORIGIN = "https://fonts.gstatic.com";

/**
 * Ceiling on the JSON fetch. SSR must never hang on theme resolution — a page that renders unthemed is
 * a far better failure than one that never renders.
 */
export const DEFAULT_TIMEOUT_MS = 5000;

export class ThemeSdk {
    private readonly apiHost: string;
    private readonly apiKey?: string;
    private readonly apiTenant?: string;
    private readonly fetchImpl: typeof fetch;
    private readonly timeoutMs: number;
    private readonly sameOrigin: boolean;
    private readonly requestInit?: RequestInit;

    constructor(config: ThemeSdkConfig) {
        // Trailing slash stripped once, so every URL join below is a clean concatenation.
        this.apiHost = config.apiHost.replace(/\/+$/, "");
        this.apiKey = config.apiKey;
        this.apiTenant = config.apiTenant;
        this.fetchImpl = config.fetch ?? globalThis.fetch;
        this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.sameOrigin = config.sameOrigin ?? false;
        this.requestInit = config.requestInit;
    }

    /** The route path for an artifact — the stable active-version path, or a specific draft for preview. */
    private path(artifact: ThemeArtifactName, preview?: ThemePreview): string {
        if (preview) {
            return `${THEME_ROUTE_PREFIX}/preview/${preview.themeId}/${preview.version}/${ARTIFACT_FILE[artifact]}`;
        }
        return THEME_ARTIFACT_PATHS[artifact];
    }

    /**
     * The URL a browser `<link>` or `<img>` should use. Relative in same-origin mode, so the frontend's
     * `/_webiny/theme/*` proxy serves it from the site's own origin; absolute otherwise.
     */
    artifactUrl(artifact: ThemeArtifactName, preview?: ThemePreview): string {
        const path = this.path(artifact, preview);
        return this.sameOrigin ? path : `${this.apiHost}${path}`;
    }

    /** Always-absolute URL for a server-side fetch, which needs an origin even in same-origin mode. */
    private fetchUrl(artifact: ThemeArtifactName, preview?: ThemePreview): string {
        return `${this.apiHost}${this.path(artifact, preview)}`;
    }

    /**
     * The `<head>` tags that apply the theme: a static preconnect to the Google Fonts file origin, then
     * the stylesheet link. Neither requires knowing which theme is active — the stylesheet is a stable
     * URL and the fonts load from its `@import`. A themeless site serves a 204 at that URL, so the link
     * is harmless. Preconnect carries `crossorigin` because font files are fetched anonymously; without
     * it the connection is not reused.
     */
    getHeadTags(preview?: ThemePreview): ThemeLinkTag[] {
        return [
            { rel: "preconnect", href: GOOGLE_FONTS_STATIC_ORIGIN, crossOrigin: "anonymous" },
            { rel: "stylesheet", href: this.artifactUrl("css", preview) }
        ];
    }

    /**
     * Fetches the JSON artifact — the resolved tokens and the policy — or null on any failure.
     *
     * Never throws: a themeless site, a timeout or a transient 5xx all yield null, so a page always
     * renders. Consumers that only need to apply the theme use `getHeadTags` and never call this.
     */
    async getTheme(preview?: ThemePreview): Promise<ThemeJson | null> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await this.fetchImpl(this.fetchUrl("json", preview), {
                ...this.buildInit(this.authHeaders()),
                signal: controller.signal
            });

            // 204 is the backend's "no active theme" — a normal, expected state, not an error.
            if (response.status === 204 || !response.ok) {
                return null;
            }

            return (await response.json()) as ThemeJson;
        } catch {
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Merges the caller's `requestInit` into a fetch without letting it clobber the abort signal — the
     * timeout signal always wins, so a stalled request can still be aborted.
     */
    private buildInit(extraHeaders?: Record<string, string>): RequestInit {
        const headers = {
            ...(this.requestInit?.headers as Record<string, string>),
            ...extraHeaders
        };
        return { ...this.requestInit, headers };
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
}

/**
 * The same-origin proxy rule for the theme routes, spread into a Next.js `rewrites()`. Pair it with
 * `sameOrigin: true` on the SDK so the emitted `<link>` uses the relative path this rule proxies.
 *
 *   // next.config.js
 *   async rewrites() { return [createThemeRewrite(process.env.WEBINY_API_URL)]; }
 */
export const createThemeRewrite = (apiHost: string): ThemeRewriteRule => {
    const host = apiHost.replace(/\/+$/, "");
    return {
        source: `${THEME_ROUTE_PREFIX}/:path*`,
        destination: `${host}${THEME_ROUTE_PREFIX}/:path*`
    };
};

/**
 * The same-origin proxy as a Nuxt (Nitro) `routeRules` fragment — the Nuxt equivalent of
 * `createThemeRewrite`. Spread into `routeRules` in `nuxt.config`, and pair with `sameOrigin: true`.
 */
export const createNuxtThemeRouteRules = (apiHost: string): ThemeNuxtRouteRules => {
    const host = apiHost.replace(/\/+$/, "");
    return {
        [`${THEME_ROUTE_PREFIX}/**`]: { proxy: `${host}${THEME_ROUTE_PREFIX}/**` }
    };
};
