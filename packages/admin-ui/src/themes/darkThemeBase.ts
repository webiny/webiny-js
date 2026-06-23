/**
 * Shared semantic mapping for dark themes.
 *
 * Components consume *semantic* tokens (e.g. `bg-neutral-base`, `text-neutral-primary`,
 * `border-neutral-dimmed`, `fill-neutral-strong`), which in light mode alias raw neutral
 * shades. A dark theme re-points those semantic aliases to inverted positions on the raw
 * ramp, so the whole admin chrome flips without touching component markup.
 *
 * This object is the dark "flip" and is theme-agnostic: a dark theme spreads it and then
 * overrides only the raw `--color-*` palette (neutral ramp + accent). It is applied at
 * runtime as inline custom properties on `<html>` (see `@webiny/app-admin` applyTheme), so
 * the `var(--color-neutral-900)` references resolve against whatever raw palette the theme
 * also sets (or the built-in light defaults, which gives "Webiny Dark").
 *
 * `--color-neutral-dark` is intentionally NOT included: it backs `bg-neutral-dark/N` hover
 * tints, modal backdrops/scrims and the inverted Toast/Tooltip surfaces, all of which must
 * remain dark in any theme. `--fill-neutral-base` and `--text-color-neutral-light` are
 * likewise omitted — they color icons/text on accent surfaces and must stay light.
 */
export type ThemeVariables = Record<string, string>;

export const darkThemeBase: ThemeVariables = {
    // Surfaces / backgrounds.
    "--color-neutral-base": "var(--color-neutral-900)",
    "--color-neutral-elevated": "var(--color-neutral-800)",
    "--color-neutral-subtle": "var(--color-neutral-800)",
    "--color-neutral-light": "var(--color-neutral-800)",
    "--color-neutral-dimmed": "var(--color-neutral-700)",
    "--color-neutral-disabled": "var(--color-neutral-700)",
    "--color-neutral-muted": "var(--color-neutral-600)",
    "--color-neutral-strong": "var(--color-neutral-500)",
    "--color-neutral-xstrong": "var(--color-neutral-300)",

    // Text.
    "--text-color-neutral-primary": "var(--color-neutral-100)",
    "--text-color-neutral-strong": "var(--color-neutral-300)",
    "--text-color-neutral-muted": "var(--color-neutral-400)",
    "--text-color-neutral-dimmed": "var(--color-neutral-500)",
    "--text-color-neutral-disabled": "var(--color-neutral-600)",

    // Borders.
    "--border-color-neutral-base": "var(--color-neutral-900)",
    "--border-color-neutral-black": "var(--color-neutral-0)",
    "--border-color-neutral-subtle": "var(--color-neutral-800)",
    "--border-color-neutral-dimmed": "var(--color-neutral-700)",
    "--border-color-neutral-dimmed-darker": "var(--color-neutral-700)",
    "--border-color-neutral-muted": "var(--color-neutral-600)",
    "--border-color-neutral-strong": "var(--color-neutral-500)",
    "--border-color-neutral-dark": "var(--color-neutral-400)",

    // Fills (icons).
    "--fill-neutral-dark": "var(--color-neutral-100)",
    "--fill-neutral-strong": "var(--color-neutral-400)",
    "--fill-neutral-xstrong": "var(--color-neutral-300)",
    "--fill-neutral-disabled": "var(--color-neutral-600)",

    // Brand "subtle" tints are near-white in light mode and would glare on dark.
    "--color-primary-subtle": "var(--color-primary-900)",
    "--color-secondary-subtle": "var(--color-success-900)",
    "--color-success-subtle": "var(--color-success-900)",
    "--color-warning-subtle": "var(--color-warning-900)",
    "--color-destructive-subtle": "var(--color-destructive-900)",

    // Soft black shadows are invisible on a dark surface — raise their opacity.
    "--shadow-sm": "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.4)",
    "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.4)",
    "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
    "--shadow-xl": "0 24px 24px rgba(0, 0, 0, 0.5)",
    "--shadow-xxl": "0 48px 48px rgba(0, 0, 0, 0.5)",

    // Signal for background-image icons (e.g. the Lexical toolbar) to invert to light.
    "--icon-invert": "1"
};
