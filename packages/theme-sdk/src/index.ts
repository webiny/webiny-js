/**
 * `@webiny/theme-sdk` — framework-agnostic frontend client for a published Webiny theme.
 *
 * Fetches the tenant's active theme and produces the `<head>` tags that apply it. Injection is the
 * framework host's job; this package holds the reusable, testable core that Next.js, Nuxt, plain React
 * and the Tailwind adapter all build on.
 */
export {
    ThemeSdk,
    getThemeLinkTags,
    getFontLinkTags,
    buildGoogleFontsUrl,
    createThemeRewrite,
    createNuxtThemeRouteRules,
    shouldRevalidateTheme,
    ACTIVE_THEME_PATH,
    THEME_ROUTE_PREFIX,
    THEME_CACHE_TAG,
    THEME_REVALIDATE_EVENTS,
    DEFAULT_TIMEOUT_MS,
    GOOGLE_FONTS_ORIGIN,
    GOOGLE_FONTS_STATIC_ORIGIN
} from "./ThemeSdk.js";
export type {
    ThemeSdkConfig,
    ActiveTheme,
    ThemeArtifactUrls,
    ThemeLinkTag,
    ThemeRewriteRule,
    ThemeNuxtRouteRules,
    ThemeFont,
    ThemeWebhookPayload,
    ThemeActivationWebhookPayload
} from "./types.js";
