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
