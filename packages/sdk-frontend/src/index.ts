export { sdk, FrontendSdk } from "./FrontendSdk.js";
export { ComponentsSdk } from "./ComponentsSdk.js";
export type {
    RemoteComponentEntry,
    LoadComponentsOptions,
    HydrateComponentDependencies,
    HydrateComponentOptions,
    HydratedComponent
} from "./ComponentsSdk.js";
export type { ContentSdkConfig, WbConfig, CmsConfig, ThemeConfig } from "./types.js";

// Theme consumption. `sdk.theme.getHeadTags()` returns the `<head>` tags — a stylesheet link to the
// stable `tokens.css` and a static `preconnect` — with no theme resolution needed. Delivery serves the
// active version at that stable URL with a short TTL, so there is no active-pointer fetch, no font
// links (fonts ship in the stylesheet's `@import`) and no revalidation to wire. `createThemeRewrite()`
// (Next.js) / `createNuxtThemeRouteRules()` (Nuxt) proxy `/_webiny/theme/*` for same-origin serving.
export {
    ThemeSdk,
    createThemeRewrite,
    createNuxtThemeRouteRules,
    THEME_ROUTE_PREFIX,
    THEME_ARTIFACT_PATHS,
    GOOGLE_FONTS_STATIC_ORIGIN
} from "@webiny/theme-sdk";
export type {
    ThemeArtifactName,
    ThemePreview,
    ThemeJson,
    ThemeLinkTag,
    ThemeRewriteRule,
    ThemeNuxtRouteRules,
    ThemeWebhookPayload
} from "@webiny/theme-sdk";

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
