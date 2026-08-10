/**
 * `@webiny/theme-sdk` — framework-agnostic frontend client for a published Webiny theme.
 *
 * Emits the `<head>` tags that apply the tenant's active theme from a stable, version-less URL with a
 * short TTL. No active-pointer fetch, no revalidation wiring — the CDN's TTL is the whole activation
 * mechanism. Injection is the framework host's job; this package is the reusable, testable core that
 * Next.js, Nuxt and a plain React app build on.
 */
export {
    ThemeSdk,
    createThemeRewrite,
    createNuxtThemeRouteRules,
    THEME_ROUTE_PREFIX,
    THEME_ARTIFACT_PATHS,
    DEFAULT_TIMEOUT_MS,
    GOOGLE_FONTS_STATIC_ORIGIN
} from "./ThemeSdk.js";
export type {
    ThemeSdkConfig,
    ThemeArtifactName,
    ThemePreview,
    ThemeJson,
    ThemeLinkTag,
    ThemeRewriteRule,
    ThemeNuxtRouteRules,
    ThemeWebhookPayload
} from "./types.js";
