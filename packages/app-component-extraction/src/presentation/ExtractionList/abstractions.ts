import { createAbstraction } from "@webiny/feature/admin";
import type { JobListItemDto } from "~/shared/types.js";

export interface IExtractionListVm {
    loading: boolean;
    items: JobListItemDto[];
    error: string | null;
    /** The job whose run is currently being started, so its row action can show a busy state. */
    startingJobId: string | null;
}

export interface IExtractionListPresenter {
    vm: IExtractionListVm;
    init(): Promise<void>;
    /** Starts a new run for a job and returns the new run's id. Throws on failure. */
    startRun(jobId: string): Promise<string>;
}

export const ExtractionListPresenter = createAbstraction<IExtractionListPresenter>(
    "ComponentExtraction/ExtractionListPresenter"
);

export namespace ExtractionListPresenter {
    export type Interface = IExtractionListPresenter;
    export type ViewModel = IExtractionListVm;
}
