export interface ThemeSdkConfig {
    /** API host, e.g. `https://d1234.cloudfront.net`. Trailing slash is tolerated. */
    apiHost: string;
    /** API key. Sent as a Bearer token on gated calls (preview). Public artifacts need none. */
    apiKey?: string;
    /** Tenant. Defaults to the API's own default when omitted. */
    apiTenant?: string;
    /** Injectable fetch, for SSR runtimes that don't expose a global. */
    fetch?: typeof fetch;
    /** Ceiling on the JSON fetch. A themeless render beats a stalled one. */
    timeoutMs?: number;
    /**
     * Emit artifact URLs as same-origin relative paths instead of absolute API URLs.
     *
     * Set this only when the frontend proxies `/_webiny/theme/*` to the API (see `createThemeRewrite`).
     * With the proxy in place, the browser fetches the stable artifact from the site's own origin.
     */
    sameOrigin?: boolean;
    /** Extra `RequestInit` merged into the JSON fetch — e.g. Next.js `{ next: { revalidate: 60 } }`. */
    requestInit?: RequestInit;
}

/** The three artifacts delivery exposes. */
export type ThemeArtifactName = "css" | "json" | "manifest";

/** Addresses a specific draft (or version) for preview, instead of the active version. */
export interface ThemePreview {
    themeId: string;
    version: number;
}

/**
 * Head-tag data a framework layout renders to apply the theme. Framework-agnostic (no JSX).
 *
 * `rel` is a plain string because the set spans `stylesheet` (the token CSS) and `preconnect` (the
 * Google Fonts origin). A layout spreads the whole object onto its `<link>`.
 */
export interface ThemeLinkTag {
    rel: string;
    href: string;
    crossOrigin?: "anonymous" | "";
    as?: string;
    type?: string;
}

/**
 * The JSON artifact, loosely typed. The SDK stays dependency-free rather than importing
 * `@webiny/theme-common`, so consumers that need the full shape narrow it themselves.
 */
export interface ThemeJson {
    schemaVersion?: number;
    themeId?: string;
    version?: number;
    policy?: unknown;
    [key: string]: unknown;
}

/** A path-rewrite rule in the Next.js `rewrites()` shape. */
export interface ThemeRewriteRule {
    source: string;
    destination: string;
}

/** A Nuxt (Nitro) `routeRules` fragment proxying the theme routes. */
export type ThemeNuxtRouteRules = Record<string, { proxy: string }>;

/**
 * A theme webhook payload — a summary matching the backend's `ThemeWebhookPayload`. Structural, so
 * this client stays free of `@webiny/api-theme`. Covers the general lifecycle events (created,
 * updated, deleted, published); activation no longer fires a webhook (C8).
 */
export interface ThemeWebhookPayload {
    themeId: string;
    version: number;
    name: string;
    status: string;
}
