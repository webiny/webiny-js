/**
 * A page's normalised URL — the key page-level overrides (page.exclude, discover.url) attach to. Mirrors
 * the API's `normalizeUrl` so a signature set here matches the one the applier compares against.
 */
export const normalizeUrl = (url: string): string => {
    try {
        const parsed = new URL(url);
        parsed.hash = "";
        parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
        return `${parsed.origin}${parsed.pathname}${parsed.search}`;
    } catch {
        return url.trim();
    }
};
