/**
 * Where a composed page is served to a visitor.
 *
 * The domain is Website Builder's `previewDomain` setting, read through the gateway rather than
 * configured again here, so this and the editor's preview canvas resolve to one place by
 * construction. Null when it is unset — the caller should say so rather than open a URL built on an
 * empty string, which would navigate to the admin's own origin and look like a broken page.
 */
const CUSTOM_PREVIEW_DOMAIN = "webiny_wb_custom_preview_domain";

/**
 * A developer's session override of that domain.
 *
 * Website Builder writes this key when a developer points the editor at their own running site, and
 * it is read here for one reason: a person who has redirected the editor expects every "open the
 * site" affordance to follow, not just that one. Reading a key another package owns is a real
 * coupling, and it is here alone so it is visible — the alternative is an Open button that
 * disagrees with the canvas beside it.
 */
const sessionOverride = (): string | null => {
    try {
        return window.localStorage.getItem(CUSTOM_PREVIEW_DOMAIN);
    } catch {
        // Storage can be unavailable (private browsing, blocked site data). The setting is the
        // answer then, which is the normal case anyway.
        return null;
    }
};

export const websiteUrl = (domain: string | null, path: string): string | null => {
    const base = (sessionOverride() ?? domain ?? "").replace(/\/+$/, "");
    if (!base) {
        return null;
    }
    return `${base}${path}`;
};
