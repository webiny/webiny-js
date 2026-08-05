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
     * Ceiling on the SSR active-theme request. A themeless render beats a stalled one. Everything else
     * the theme client needs (host, key, tenant, fetch) is shared from the top-level config.
     */
    timeoutMs?: number;
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
