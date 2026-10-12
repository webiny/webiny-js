import type { JobDeletionRecord, SiteDeletionPlan } from "./JobDeletionStore.js";

/** What the delete dialog reads: counts, not ids, and the delete's steps. */
export interface JobDeletionView {
    jobId: string;
    jobName: string;
    plan: {
        status: "running" | "done" | "failed";
        error: string | null;
        computedOn: string | null;
        blocked: string | null;
        runs: number;
        modelCalls: number;
        corrections: number;
        root: {
            pages: number;
            pagesLive: number;
            pagesBinned: number;
            components: number;
            componentsKeptShared: number;
            componentsKeptUsed: number;
            images: number;
            imagesKeptShared: number;
            referenceImages: number;
            themeDeleted: boolean;
            themeKept: string | null;
        } | null;
        site: SiteDeletionPlan | null;
    };
    deletion: JobDeletionRecord["deletion"] | null;
}

export const deletionView = (record: JobDeletionRecord): JobDeletionView => {
    const result = record.plan.result;
    return {
        jobId: record.jobId,
        jobName: record.jobName,
        plan: {
            status: record.plan.status,
            error: record.plan.error ?? null,
            computedOn: result?.computedOn ?? null,
            blocked: result?.blocked ?? null,
            runs: result?.runs ?? 0,
            modelCalls: result?.modelCalls ?? 0,
            corrections: result?.corrections ?? 0,
            root: result
                ? {
                      pages: result.root.pages.ids.length,
                      pagesLive: result.root.pages.live,
                      pagesBinned: result.root.pages.binned,
                      components: result.root.components.delete.length,
                      componentsKeptShared: result.root.components.keptShared.length,
                      componentsKeptUsed: result.root.components.keptUsed.length,
                      images: result.root.images.delete.length,
                      imagesKeptShared: result.root.images.keptShared,
                      referenceImages: result.root.referenceFileIds.length,
                      themeDeleted: Boolean(result.root.theme.delete),
                      themeKept: result.root.theme.kept
                  }
                : null,
            site: result?.site ?? null
        },
        deletion: record.deletion ?? null
    };
};
