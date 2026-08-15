import { createAbstraction } from "@webiny/feature/admin";
import type { JobListItemDto } from "~/shared/types.js";

export type StatusFilter = "all" | "not-started" | "running" | "paused" | "failed" | "complete";
export type ListSort = "lastRun" | "name";

export interface IExtractionListVm {
    loading: boolean;
    items: JobListItemDto[];
    error: string | null;
    /** The job whose run is currently being started, so its row action can show a busy state. */
    startingJobId: string | null;
    /** Toolbar state (spec §2): free-text search, the status filter chip and the sort chip. */
    search: string;
    statusFilter: StatusFilter;
    sort: ListSort;
    /** The count shown on the Library tab — the number of components already promoted to the Library. */
    libraryCount: number;
}

export interface IExtractionListPresenter {
    vm: IExtractionListVm;
    init(): Promise<void>;
    /** Starts a new run for a job and returns the new run's id. Throws on failure. */
    startRun(jobId: string): Promise<string>;
    setSearch(search: string): void;
    setStatusFilter(status: StatusFilter): void;
    setSort(sort: ListSort): void;
}

export const ExtractionListPresenter = createAbstraction<IExtractionListPresenter>(
    "ComponentExtraction/ExtractionListPresenter"
);

export namespace ExtractionListPresenter {
    export type Interface = IExtractionListPresenter;
    export type ViewModel = IExtractionListVm;
}
