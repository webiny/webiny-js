import { carriesPass } from "@webiny/api-component-extraction/domain/qualityPasses.js";

/**
 * What a publish produced beyond the build steps, as the Site step reports it: the sitemap, the
 * site's images, and the pages that carry their source's title and description.
 *
 * Each is a count of what the pipeline did, not a claim about the result. The wording lives in the
 * admin; this records the numbers.
 */
export interface SiteQualities {
    /** Published pages carrying both an SEO title and a description, of the published pages. */
    seo?: { pages: number; carried: number };
    /** The sitemap written to the site's File Manager, or why none was. */
    sitemap?: { pages: number; fileId: string; url: string } | { error: string };
    /** The image files this build put in the site's File Manager, by stored format. */
    images?: ImagesSummary;
    /**
     * Of the components this site was built with, how many were generated with each quality pass in
     * their prompt. Read from each component's own record, so a run that never had the prompt counts
     * zero and its beta lines are not shown.
     */
    generation?: { components: number; accessibility: number; performance: number };
}

export interface ImagesSummary {
    files: number;
    bytes: number;
    /** File count by MIME type, most files first. */
    byType: Array<{ type: string; files: number }>;
}

const escapeXml = (text: string): string =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

/**
 * The sitemap of a site's published pages, at the address each is served from.
 *
 * `pageUrl` is the address "Open site" opens: the website's domain, the path, and the site's tenant.
 * There is no per-site domain yet, so that is the only address the page is actually at. Paths are
 * deduplicated: one live page per path.
 */
export const buildSitemap = (params: {
    pages: Array<{ path: string; savedOn?: string }>;
    pageUrl: (path: string) => string;
}): { xml: string; pages: number } => {
    const byPath = new Map<string, string | undefined>();
    for (const page of params.pages) {
        byPath.set(page.path, page.savedOn);
    }
    const entries = [...byPath.entries()].sort(([a], [b]) => a.localeCompare(b));
    const urls = entries.map(([path, savedOn]) =>
        [
            "  <url>",
            `    <loc>${escapeXml(params.pageUrl(path))}</loc>`,
            ...(savedOn ? [`    <lastmod>${escapeXml(savedOn)}</lastmod>`] : []),
            "  </url>"
        ].join("\n")
    );
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls,
        "</urlset>",
        ""
    ].join("\n");
    return { xml, pages: entries.length };
};

/**
 * The image files a build put in the site's File Manager, each counted once: several captured images
 * can be the same file. The type is what the file is stored as, which is what the source site served.
 */
export const summariseImages = (
    files: Array<{ fileId: string; contentType: string; size: number }>
): ImagesSummary => {
    const byId = new Map<string, { contentType: string; size: number }>();
    for (const file of files) {
        byId.set(file.fileId, {
            contentType: file.contentType.split(";")[0]!.trim().toLowerCase(),
            size: file.size
        });
    }
    const counts = new Map<string, number>();
    let bytes = 0;
    for (const file of byId.values()) {
        counts.set(file.contentType, (counts.get(file.contentType) ?? 0) + 1);
        bytes += file.size;
    }
    return {
        files: byId.size,
        bytes,
        byType: [...counts.entries()]
            .map(([type, count]) => ({ type, files: count }))
            .sort((a, b) => b.files - a.files || a.type.localeCompare(b.type))
    };
};

/** How many of the site's components were generated with each quality pass. */
export const countGenerationPasses = (
    components: Array<{ qualityInstructions?: string[] }>
): { components: number; accessibility: number; performance: number } => ({
    components: components.length,
    accessibility: components.filter(c => carriesPass(c.qualityInstructions, "accessibility"))
        .length,
    performance: components.filter(c => carriesPass(c.qualityInstructions, "performance")).length
});

/** How many published pages carry both an SEO title and a description. */
export const countSeo = (
    pages: Array<{ properties?: { seo?: { title?: unknown; description?: unknown } } }>
): { pages: number; carried: number } => ({
    pages: pages.length,
    carried: pages.filter(page => {
        const seo = page.properties?.seo;
        return (
            typeof seo?.title === "string" &&
            seo.title.trim() !== "" &&
            typeof seo.description === "string" &&
            seo.description.trim() !== ""
        );
    }).length
});
