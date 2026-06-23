/**
 * Applies a theme's CSS variables as inline custom properties on `<html>`, clearing any
 * variables applied by the previously-active theme first. The "light" theme has no variables,
 * so applying it simply removes all overrides and reveals the default `@theme` palette.
 *
 * This generalizes `AdminConfig/Theme/assignColor.ts` (which does the same for brand colors)
 * to a full theme's worth of tokens, and is what makes runtime-registered themes possible —
 * there are no static per-theme CSS blocks to match against.
 */
let appliedKeys: string[] = [];

export const applyTheme = (variables: Record<string, string>): void => {
    if (typeof document === "undefined") {
        return;
    }

    const root = document.documentElement;

    // Remove variables set by the previous theme that the new theme doesn't define.
    for (const key of appliedKeys) {
        if (!(key in variables)) {
            root.style.removeProperty(key);
        }
    }

    for (const [key, value] of Object.entries(variables)) {
        root.style.setProperty(key, value);
    }

    appliedKeys = Object.keys(variables);
};
