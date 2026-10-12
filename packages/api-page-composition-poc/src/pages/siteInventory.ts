export interface SiteInventory {
    /** Every component in the site tenant's Library. */
    components: number;
    /** Components no published page places and the current approval does not hold: left over. */
    unused: string[];
    /**
     * Components of the current approval no published page places yet: they go live at the next
     * publish. Only for a site whose approval lives in its tenant; empty otherwise.
     */
    pending: string[];
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
    /** The current approval's component names, when it lives in this tenant. */
    approvedNames?: string[];
}): SiteInventory => {
    const published = params.pages.filter(page => page.status === "published");
    const used = new Set(published.flatMap(placedNames));
    const approved = new Set(params.approvedNames ?? []);
    const notLive = params.componentNames.filter(name => !used.has(name));
    return {
        components: params.componentNames.length,
        unused: notLive.filter(name => !approved.has(name)).sort(),
        pending: notLive.filter(name => approved.has(name)).sort(),
        publishedPages: published.length,
        unpublishedPages: params.pages.filter(page => page.status === "unpublished").length,
        draftPages: params.pages.filter(page => page.status === "draft").length
    };
};
