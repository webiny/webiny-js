import { normalizeUrl } from "@webiny/api-component-extraction/domain/overrides.js";
import type { PageMapEntry } from "~/domain/types.js";

export interface RetirementPlan {
    /** Earlier pages to unpublish: replaced at their path, or no longer in the run (`dropped`). */
    unpublish: PageMapEntry[];
    /**
     * Earlier pages whose source this run still has, but which did not compose this time. They stay
     * published, and the composition records them so the next one retires them once their path composes
     * again.
     */
    kept: PageMapEntry[];
    /** Earlier pages whose source this run no longer assembles. Unpublished, and said so. */
    dropped: PageMapEntry[];
}

/**
 * Which earlier pages a composition takes down, and which it must leave up.
 *
 * Deciding by page id alone took down a working page whenever it failed to compose again: its id was
 * not in the new set, so it was unpublished and nothing replaced it, and the build said only "1 with
 * problems" (`a-rebuild-can-unpublish-a-working-page.md`). An earlier page is replaced only when its
 * path got a new page. One the run still assembles but could not compose is kept. One the run no
 * longer assembles is dropped: a job is one site, built from its latest run.
 *
 * `earlier` is in the reader's order (this run's previous composition first), so where two earlier
 * pages could be kept at one path, the most recent is the one kept and the other is unpublished.
 */
export const planRetirement = (params: {
    earlier: PageMapEntry[];
    created: PageMapEntry[];
    assembledUrls: string[];
}): RetirementPlan => {
    const live = new Set(params.created.map(page => page.pageId));
    const composedPaths = new Set(params.created.map(page => page.path));
    const assembled = new Set(params.assembledUrls.map(normalizeUrl));
    const keptPaths = new Set<string>();
    const seen = new Set<string>();
    const plan: RetirementPlan = { unpublish: [], kept: [], dropped: [] };

    for (const page of params.earlier) {
        if (!page.pageId || live.has(page.pageId) || seen.has(page.pageId)) {
            continue;
        }
        seen.add(page.pageId);
        if (composedPaths.has(page.path) || keptPaths.has(page.path)) {
            plan.unpublish.push(page);
        } else if (assembled.has(page.normalizedUrl || normalizeUrl(page.sourceUrl))) {
            keptPaths.add(page.path);
            plan.kept.push(page);
        } else {
            plan.unpublish.push(page);
            plan.dropped.push(page);
        }
    }
    return plan;
};
