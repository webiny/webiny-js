/**
 * Applies a fully-composed set of CSS variables as inline custom properties on `<html>`,
 * clearing any variables applied by the previous call first. The "light" theme has no variables
 * of its own, so applying it simply removes the overrides and reveals the default `@theme`
 * palette.
 *
 * This is the single writer to `<html>`'s inline styles. Callers compose what goes in — the
 * active theme's variables plus the brand colors resolved from `<AdminConfig.Theme.Color />` —
 * so there is never more than one owner of a given custom property.
 */
let appliedKeys: string[] = [];

export const applyTheme = (variables: Record<string, string>): void => {
    if (typeof document === "undefined") {
        return;
    }

    const root = document.documentElement;

    // Remove variables set by the previous call that the new set doesn't define.
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
