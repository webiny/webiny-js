export interface SiteInventory {
    /** Every component in the site tenant's Library. */
    components: number;
    /** Components no published page places, by name: left over from earlier builds. */
    unused: string[];
    publishedPages: number;
    /** Pages taken offline: earlier builds' copies, superseded at their path. */
    unpublishedPages: number;
    /** Drafts: a preview's, or a page someone is building in the site. Never published. */
    draftPages: number;
}

interface InventoryPage {
    status: string;
    elements: Record<string, unknown> | null | undefined;
}

/** The component names a page's elements place. */
const placedNames = (page: InventoryPage): string[] =>
    Object.values(page.elements ?? {}).flatMap(element => {
        const name = (element as { component?: { name?: unknown } } | null)?.component?.name;
        return typeof name === "string" ? [name] : [];
    });

/**
 * What a site tenant holds beyond what its live pages use.
 *
 * Builds never delete. Stage 9's default keeps both when a name is taken, so every re-approval
 * reaches the site as `Name (2)` beside `Name`, and every build leaves the previous build's pages
 * unpublished. Nothing said so. This counts both, so the Site view can say it.
 */
export const siteInventory = (params: {
    pages: InventoryPage[];
    componentNames: string[];
}): SiteInventory => {
    const published = params.pages.filter(page => page.status === "published");
    const used = new Set(published.flatMap(placedNames));
    return {
        components: params.componentNames.length,
        unused: params.componentNames.filter(name => !used.has(name)).sort(),
        publishedPages: published.length,
        unpublishedPages: params.pages.filter(page => page.status === "unpublished").length,
        draftPages: params.pages.filter(page => page.status === "draft").length
    };
};
