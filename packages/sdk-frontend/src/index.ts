export { sdk, FrontendSdk } from "./FrontendSdk.js";
export type { ContentSdkConfig, WbConfig, CmsConfig, ThemeConfig } from "./types.js";

// Theme consumption. `sdk.theme.getActiveTheme()` at SSR + `getThemeLinkTags()` in the layout `<head>`.
export { ThemeSdk, getThemeLinkTags } from "@webiny/theme-sdk";
export type { ActiveTheme, ThemeArtifactUrls, ThemeLinkTag } from "@webiny/theme-sdk";

// Re-export Result and error types from @webiny/sdk.
export { Result, HttpError, ApiError, NetworkError, ValidationError } from "@webiny/sdk";
export type { Language } from "@webiny/sdk";

// Re-export CMS write operation types from @webiny/sdk.
export type {
    CmsEntryData,
    CreateEntryParams,
    CreateCmsEntryData,
    UpdateEntryRevisionParams,
    UpdateCmsEntryData,
    DeleteEntryRevisionParams,
    PublishEntryRevisionParams,
    UnpublishEntryRevisionParams
} from "@webiny/sdk";

// Re-export useful values and types from both SDKs
export { createComponent as createCmsComponent, resolveRefs } from "@webiny/cms-sdk";
export type {
    CmsSdkConfig,
    CmsEntryValues,
    CmsEntry,
    CmsListMeta,
    CmsListResult,
    GetEntryParams,
    ListEntriesParams,
    CmsModelDefinition,
    CmsModelMetadata,
    CmsRefModelMetadata,
    Asset,
    AssetImage,
    AssetCrop,
    AssetFocalPoint,
    AssetDocument,
    AssetVideo
} from "@webiny/cms-sdk";

export type {
    PublicPage,
    PublicRedirect,
    ListPagesOptions,
    ListPagesResult,
    ComponentGroup,
    WebsiteBuilderThemeInput,
    ComponentManifest,
    ComponentInput
} from "@webiny/website-builder-sdk";

export { createTheme, createComponent as createWbComponent } from "@webiny/website-builder-sdk";
