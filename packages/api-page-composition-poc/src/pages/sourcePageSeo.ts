/** The SEO fields a composed page carries over from its source page. */
export interface PageSeo {
    title?: string;
    description?: string;
    /** Always present, empty: the website reads it without checking (see `pageSeo`). */
    metaTags: Array<{ name: string; content: string }>;
}

const ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    rsquo: "’",
    lsquo: "‘",
    rdquo: "”",
    ldquo: "“",
    ndash: "–",
    mdash: "—",
    hellip: "…"
};

const decodeEntities = (text: string): string =>
    text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
        if (entity.startsWith("#x") || entity.startsWith("#X")) {
            return String.fromCodePoint(parseInt(entity.slice(2), 16));
        }
        if (entity.startsWith("#")) {
            return String.fromCodePoint(parseInt(entity.slice(1), 10));
        }
        return ENTITIES[entity.toLowerCase()] ?? whole;
    });

const ATTRIBUTE = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

const attributesOf = (tag: string): Map<string, string> => {
    const attributes = new Map<string, string>();
    for (const match of tag.matchAll(ATTRIBUTE)) {
        attributes.set(match[1]!.toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
    }
    return attributes;
};

const clean = (text: string): string => decodeEntities(text).replace(/\s+/g, " ").trim();

const descriptionIn = (html: string): string | undefined => {
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
        const attributes = attributesOf(tag);
        if (attributes.get("name")?.toLowerCase() === "description") {
            return clean(attributes.get("content") ?? "") || undefined;
        }
    }
    return undefined;
};

/**
 * The source page's meta description, from the raw HTML capture stored.
 *
 * The `<head>` first, then the whole document: a Next.js site streams its metadata after the head, so
 * webiny.com's home page carries its `<title>` and description at the end of the body. Microdata in the
 * body describes elements with `itemprop`, not `name`, so it is not mistaken for the page's.
 * Undefined when the page declares none or an empty one.
 */
export const readSourceDescription = (html: string): string | undefined => {
    const headEnd = html.search(/<\/head\s*>/i);
    return (
        (headEnd >= 0 ? descriptionIn(html.slice(0, headEnd)) : undefined) ?? descriptionIn(html)
    );
};

/**
 * The page's SEO fields: the source's `<title>` and meta description, nothing else.
 *
 * **Not the canonical URL.** Every captured page declares one, and it names the source site's domain
 * (`https://www.71westlandapts.com/…`). Copied, it would tell search engines the migrated page is a
 * duplicate of the old one, with nothing on the page to show it. Open Graph tags are left for the same
 * reason: `og:url` names the old domain too.
 *
 * `metaTags` is always there, empty, as the admin's SEO settings save it. The website reads
 * `seo?.metaTags.reduce(...)`: with no `seo` that is undefined, and with a `seo` that has no
 * `metaTags` it throws, which serves the page with no `<title>` and no description.
 *
 * `title` is the source's own `<title>` only. A title derived from the path is a label for the page
 * list, not something the source declared, so it is not put forward as the page's SEO title.
 */
export const pageSeo = (params: { declaredTitle?: string; description?: string }): PageSeo => {
    const seo: PageSeo = { metaTags: [] };
    const title = params.declaredTitle?.replace(/\s+/g, " ").trim();
    if (title) {
        seo.title = title;
    }
    if (params.description) {
        seo.description = params.description;
    }
    return seo;
};
