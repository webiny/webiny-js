import { createAbstraction, Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { PageCompositionError } from "~/domain/errors.js";
import type { RootDeletionPlan } from "./planJobDeletion.js";
import type { SiteContentCounts } from "./SiteTenantEraser.js";

/** The job's site as a delete finds it. */
export interface SiteDeletionPlan extends SiteContentCounts {
    tenantId: string;
    /** False when the record names a tenant that is already gone: only the record is left to delete. */
    exists: boolean;
    /** A page of it is published: deleting the job without the site would leave it serving, unowned. */
    live: boolean;
}

/** What deleting a job removes, after the sharing checks, as the dialog shows it and the delete runs it. */
export interface JobDeletionPlan {
    jobId: string;
    jobName: string;
    computedOn: string;
    /** Why it cannot be deleted now (a run or a site build is running); null when it can. */
    blocked: string | null;
    runs: number;
    modelCalls: number;
    /** Kept: the correction log is the labelled record extraction is tuned against. */
    corrections: number;
    root: RootDeletionPlan;
    site: SiteDeletionPlan | null;
}

export type JobDeletionStep =
    | "check"
    | "site-content"
    | "site-tenant"
    | "pages"
    | "components"
    | "images"
    | "reference-images"
    | "theme"
    | "runs"
    | "job";

export interface JobDeletionStepRecord {
    step: JobDeletionStep;
    status: "running" | "done" | "failed" | "skipped";
    detail: string;
    at: string;
}

/** Kept after the job is gone, so the dialog can say the delete finished, or where it stopped. */
export interface JobDeletionRecord {
    jobId: string;
    jobName: string;
    plan: {
        status: "running" | "done" | "failed";
        taskId?: string;
        startedOn: string;
        error?: string;
        result?: JobDeletionPlan;
    };
    deletion?: {
        status: "running" | "done" | "failed";
        taskId?: string;
        includeSite: boolean;
        startedOn: string;
        finishedOn?: string;
        error?: string;
        steps: JobDeletionStepRecord[];
    };
}

export const jobDeletionKey = (jobId: string): string => `pageCompositionPoc:jobDeletion:${jobId}`;

export interface IJobDeletionStore {
    get(jobId: string): Promise<JobDeletionRecord | null>;
    set(record: JobDeletionRecord): Promise<Result<void, PageCompositionError>>;
}

export const JobDeletionStore = createAbstraction<IJobDeletionStore>(
    "PageCompositionPoc/JobDeletionStore"
);
export namespace JobDeletionStore {
    export type Interface = IJobDeletionStore;
}

class JobDeletionStoreImpl implements IJobDeletionStore {
    constructor(private store: KeyValueStore.Interface) {}

    async get(jobId: string): Promise<JobDeletionRecord | null> {
        const result = await this.store.get<JobDeletionRecord>(jobDeletionKey(jobId), {
            consistent: true
        });
        return result.isOk() ? (result.value ?? null) : null;
    }

    async set(record: JobDeletionRecord): Promise<Result<void, PageCompositionError>> {
        const result = await this.store.set(jobDeletionKey(record.jobId), record);
        if (result.isFail()) {
            return Result.fail(
                new PageCompositionError("Could not store the job's deletion record.", {
                    jobId: record.jobId
                })
            );
        }
        return Result.ok(undefined);
    }
}

export const JobDeletionStoreImplementation = JobDeletionStore.createImplementation({
    implementation: JobDeletionStoreImpl,
    dependencies: [KeyValueStore]
});
