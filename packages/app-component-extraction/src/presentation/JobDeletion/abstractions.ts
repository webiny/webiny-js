import { createAbstraction } from "@webiny/feature/admin";
import type { JobDeletionDto } from "~/shared/types.js";

export interface IJobDeletionVm {
    /** The job the dialog is open for; null when closed. */
    jobId: string | null;
    jobName: string;
    /** The last count and, once a delete ran, its steps. Null until the first count arrives. */
    deletion: JobDeletionDto | null;
    /** The person chose to delete the live site with the job. */
    includeSite: boolean;
    /** A request that failed before reaching the task (permissions, a refusal, the network). */
    error: string | null;
    /** The confirm request is on its way. */
    submitting: boolean;
}

export interface IJobDeletionPresenter {
    vm: IJobDeletionVm;
    /** Opens the dialog and counts afresh: a count from earlier may no longer be true. */
    open(jobId: string, jobName: string): Promise<void>;
    close(): void;
    setIncludeSite(includeSite: boolean): void;
    /** Starts the delete of what the dialog shows. */
    confirm(): Promise<void>;
    /** Counts again, after a stop or a changed count. */
    recount(): Promise<void>;
}

export const JobDeletionPresenter = createAbstraction<IJobDeletionPresenter>(
    "ComponentExtraction/JobDeletionPresenter"
);

export namespace JobDeletionPresenter {
    export type Interface = IJobDeletionPresenter;
    export type ViewModel = IJobDeletionVm;
}
