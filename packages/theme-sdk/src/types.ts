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

/** Head-tag data a framework layout renders to apply the theme. Framework-agnostic (no JSX). */
export interface ThemeLinkTag {
    rel: "stylesheet";
    href: string;
}
