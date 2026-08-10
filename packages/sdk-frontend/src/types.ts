import type { ComponentGroup, WebsiteBuilderThemeInput } from "@webiny/website-builder-sdk";

export interface WbConfig {
    theme?: WebsiteBuilderThemeInput;
    previewParams?: string;
    componentGroups?: ComponentGroup[];
}

export interface CmsConfig {
    // Extension point for future CMS-specific settings.
}

export interface ThemeConfig {
    /**
     * Ceiling on the theme JSON fetch. A themeless render beats a stalled one. Everything else the
     * theme client needs (host, key, tenant, fetch) is shared from the top-level config.
     */
    timeoutMs?: number;
    /**
     * Emit artifact URLs as same-origin relative paths. Set only when the frontend proxies
     * `/_webiny/theme/*` to the API (see `createThemeRewrite`).
     */
    sameOrigin?: boolean;
    /**
     * Extra `RequestInit` merged into theme fetches — e.g. Next.js `{ next: { revalidate: 60 } }`, which
     * re-reads the theme JSON on a short timer. Stable URLs mean activation propagates within the CDN
     * TTL on their own, so no cache tag or webhook is involved.
     */
    requestInit?: RequestInit;
}

export interface ContentSdkConfig {
    endpoint: string;
    token: string;
    tenant?: string;
    preview?: boolean;
    fetch?: typeof fetch;
    cms?: CmsConfig;
    wb?: WbConfig;
    theme?: ThemeConfig;
}
