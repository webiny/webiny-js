import type { HeadersConfig } from "@webiny/sdk";
import type { ComponentGroup, WebsiteBuilderThemeInput } from "@webiny/website-builder-sdk";

export interface WbConfig {
    theme?: WebsiteBuilderThemeInput;
    previewParams?: string;
    componentGroups?: ComponentGroup[];
}

export interface CmsConfig {
    // Extension point for future CMS-specific settings.
}

export interface ContentSdkConfig {
    endpoint: string;
    token: string;
    tenant?: string;
    /** Extra headers sent with every API request; a function is called before each request. */
    headers?: HeadersConfig;
    preview?: boolean;
    fetch?: typeof fetch;
    cms?: CmsConfig;
    wb?: WbConfig;
}
