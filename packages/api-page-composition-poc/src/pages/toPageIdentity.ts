export interface PageIdentity {
    /** The Website Builder path, always leading-slashed and never trailing-slashed except the root. */
    path: string;
    title: string;
}

const INDEX_FILE = /\/index\.(html?|php|aspx?)$/i;

const slugifySegment = (segment: string): string =>
    decodeURIComponent(segment)
        .toLowerCase()
        .replace(/\.(html?|php|aspx?)$/i, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

/** "our-team" → "Our Team"; a segment that slugified to nothing falls back to the caller's default. */
const titleiseSegment = (segment: string): string =>
    segment
        .split("-")
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

/**
 * The Website Builder path and title for a source page URL. The site root maps to `/`.
 *
 * PROOF OF CONCEPT: the title comes from the URL, not from the page's `<title>`. Capture does record
 * the real title (`CapturedPage.title`), but Assemble does not forward it, and this package does not
 * widen that contract — so a migrated page is named after its slug. The discard log is the place that
 * records this kind of fiat decision; a real migration should carry the page's own title.
 */
export const toPageIdentity = (url: string): PageIdentity => {
    let pathname: string;
    try {
        pathname = new URL(url).pathname;
    } catch {
        // Not absolute — treat the whole string as a path so a relative entry still yields something.
        pathname = url.startsWith("/") ? url : `/${url}`;
    }

    // An index file addresses its directory, so `/about/index.html` and `/about/` are one page.
    pathname = pathname.replace(INDEX_FILE, "");

    const segments = pathname.split("/").map(slugifySegment).filter(Boolean);

    if (segments.length === 0) {
        return { path: "/", title: "Home" };
    }

    const last = segments[segments.length - 1] as string;
    return {
        path: `/${segments.join("/")}`,
        title: titleiseSegment(last) || "Untitled"
    };
};
