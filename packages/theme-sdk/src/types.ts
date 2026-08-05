export interface ThemeSdkConfig {
    /** API host, e.g. `https://d1234.cloudfront.net`. Trailing slash is tolerated. */
    apiHost: string;
    /** API key. Sent as a Bearer token on the SSR active-theme call. Public artifacts need none. */
    apiKey?: string;
    /** Tenant. Defaults to the API's own default when omitted. */
    apiTenant?: string;
    /** Injectable fetch, for SSR runtimes that don't expose a global. */
    fetch?: typeof fetch;
    /** Ceiling on the active-theme request. A themeless render beats a stalled one. */
    timeoutMs?: number;
    /**
     * Emit artifact URLs as same-origin relative paths instead of absolute API URLs.
     *
     * Set this only when the frontend proxies `/_webiny/theme/*` to the API (see `createThemeRewrite`).
     * With the proxy in place, the browser fetches the immutable artifact from the site's own origin —
     * one fewer cross-origin hop, and the CDN caches it under the site domain. Without the proxy, leave
     * it off (the default): absolute URLs work with no extra infrastructure.
     */
    sameOrigin?: boolean;
    /**
     * Extra `RequestInit` merged into every theme fetch.
     *
     * The framework-agnostic way to attach cache metadata. A Next.js app sets
     * `{ next: { tags: [THEME_CACHE_TAG], revalidate: 3600 } }` so the webhook handler's
     * `revalidateTag(THEME_CACHE_TAG)` drops the cached active pointer. The client's own abort signal
     * always wins, so this cannot disable the timeout.
     */
    requestInit?: RequestInit;
}

/**
 * A theme webhook payload — a summary, matching the backend's `ThemeWebhookPayload`.
 *
 * Structural, so this client stays free of `@webiny/api-theme`. The receiver gets which theme and
 * version changed; it fetches the artifacts itself if it wants the values.
 */
export interface ThemeWebhookPayload {
    themeId: string;
    version: number;
    name: string;
    status: string;
}

/** The `theme.activated` payload, which additionally carries the now-live version's artifact paths. */
export interface ThemeActivationWebhookPayload extends ThemeWebhookPayload {
    artifacts: { css: string; json: string };
    previous: { themeId: string; version: number } | null;
}

/**
 * A path-rewrite rule, in the Next.js `rewrites()` / path-to-regexp shape.
 *
 * Framework-neutral data — the fields are plain strings — but the `:path*` wildcard is Next.js syntax
 * because Next is the primary target. Nuxt/other hosts use the same `source`/`destination` with their
 * own wildcard (`**`); that parity lands in a later slice.
 */
export interface ThemeRewriteRule {
    source: string;
    destination: string;
}

/**
 * A Nuxt (Nitro) `routeRules` fragment proxying the theme routes — the Nuxt equivalent of a
 * `ThemeRewriteRule`. Keyed on the route pattern (`/_webiny/theme/**`), the value a proxy target.
 */
export type ThemeNuxtRouteRules = Record<string, { proxy: string }>;

/** Absolute URLs to a published theme's artifacts. */
export interface ThemeArtifactUrls {
    css: string;
    json: string;
}

/** The active, published theme for a tenant. */
export interface ActiveTheme {
    themeId: string;
    version: number;
    activatedOn: string;
    artifacts: ThemeArtifactUrls;
}

/**
 * Head-tag data a framework layout renders to apply the theme. Framework-agnostic (no JSX).
 *
 * `rel` is a plain string because the set spans `stylesheet` (the token CSS and the fonts CSS) and
 * `preconnect` (the font origins). The optional attributes carry what a `<link rel="preconnect">` and a
 * future `preload` need; a layout spreads the whole object onto its `<link>`.
 */
export interface ThemeLinkTag {
    rel: string;
    href: string;
    crossOrigin?: "anonymous" | "";
    as?: string;
    type?: string;
}

/**
 * A web font the theme uses, as read from the JSON artifact's `fonts`.
 *
 * A minimal structural view of the backend's `FontDefinition` — only the fields needed to build the
 * font request — so this client stays dependency-free rather than importing `@webiny/theme-common`.
 * Google Fonts only in v1, matching the producer.
 */
export interface ThemeFont {
    family: string;
    weights: number[];
    styles: string[];
    display?: string;
}
