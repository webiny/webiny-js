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
    ACTIVE_THEME_PATH,
    THEME_ROUTE_PREFIX,
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
    ThemeFont
} from "./types.js";
