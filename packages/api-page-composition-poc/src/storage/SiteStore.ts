import { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { PageCompositionError } from "~/domain/errors.js";
import { siteKey } from "~/constants.js";

export type SiteBuildStep = "tenant" | "theme" | "components" | "images" | "pages";

export interface SiteBuildStepRecord {
    step: SiteBuildStep;
    status: "running" | "done" | "failed";
    /** What the step did, in a sentence the admin shows as it stands. */
    detail: string;
    at: string;
}

/**
 * A job's site in its own tenant. One per job: a job is a site, and the tenant is reused by every
 * later build of it. Kept in the EXTRACTION tenant, beside the page maps, as the PoC's own state.
 */
export interface SiteRecord {
    jobId: string;
    tenantId: string;
    tenantName: string;
    createdOn: string;
    /**
     * Which site component holds each cluster, by signature, from the builds so far. A re-approved
     * component arrives with a new name; this is how the build updates the one it already holds
     * instead of adding a second (`planComponentCopy`). Absent on sites built before it existed.
     */
    components?: Record<string, string>;
    /** The theme revision last copied in, so a rebuild does not create another copy of the same one. */
    themeSourceId?: string;
    themeTargetId?: string;
    /**
     * The last preview: a composition of drafts into the site tenant, for a job that approves there.
     * Kept apart from `lastBuild`, which is what the site last published.
     */
    lastPreview?: SiteRecord["lastBuild"];
    lastBuild?: {
        runId: string;
        /** The background task, recorded by the mutation that started it. */
        taskId?: string;
        status: "running" | "done" | "failed";
        startedOn: string;
        finishedOn?: string;
        steps: SiteBuildStepRecord[];
        error?: string;
    };
}

export interface ISiteStore {
    get(jobId: string): Promise<SiteRecord | null>;
    set(record: SiteRecord): Promise<Result<void, PageCompositionError>>;
}

export const SiteStore = createAbstraction<ISiteStore>("PageCompositionPoc/SiteStore");
export namespace SiteStore {
    export type Interface = ISiteStore;
}

class SiteStoreImpl implements ISiteStore {
    constructor(private store: KeyValueStore.Interface) {}

    async get(jobId: string): Promise<SiteRecord | null> {
        const result = await this.store.get<SiteRecord>(siteKey(jobId));
        // A job that has never been built has no record; that is a state, not a failure.
        return result.isOk() ? (result.value ?? null) : null;
    }

    async set(record: SiteRecord): Promise<Result<void, PageCompositionError>> {
        const result = await this.store.set(siteKey(record.jobId), record);
        if (result.isFail()) {
            return Result.fail(
                new PageCompositionError("Could not store the site record.", {
                    jobId: record.jobId
                })
            );
        }
        return Result.ok(undefined);
    }
}

export const SiteStoreImplementation = SiteStore.createImplementation({
    implementation: SiteStoreImpl,
    dependencies: [KeyValueStore]
});
