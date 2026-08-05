/**
 * `@webiny/theme-tailwind` — a Tailwind CSS preset that binds utility classes to a Webiny theme.
 *
 * Build-time and pure: it maps the canonical token names to their `var(--wby-*)` references, so utilities
 * like `bg-surface-page` resolve to the active theme's values at runtime, with no rebuild on theme change.
 */
export { webinyThemePreset, webinyThemeTokens } from "./preset.js";
export type { WebinyThemePreset, WebinyThemeScales } from "./preset.js";
