/**
 * Ensures a theme-token stylesheet is present in the document, so a previewed component's
 * `var(--wby-*)` values resolve to a real theme instead of falling back to their literals.
 *
 * Idempotent: a no-op when a stylesheet link to the same artifact URL already exists (e.g. one the
 * host layout emitted), so it never duplicates the active theme's link. Returns a cleanup that
 * removes only a link it actually added. A link it appends comes last in `<head>`, so a specific
 * previewed theme's `:root` values override the site's active theme.
 */
export function ensureThemeTokenLink(doc: Document, href: string): (() => void) | undefined {
    const alreadyPresent = Array.from(
        doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    ).some(link => link.getAttribute("href") === href);

    if (alreadyPresent) {
        return undefined;
    }

    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.dataset.wbyThemeTokens = "true";
    link.href = href;
    doc.head.appendChild(link);

    return () => {
        link.remove();
    };
}
