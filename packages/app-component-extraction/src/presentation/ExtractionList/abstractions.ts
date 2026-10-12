import { createAbstraction } from "@webiny/feature/admin";
import type { JobListItemDto } from "~/shared/types.js";
import type { BoardColumn, SortOrder } from "./jobBoard.js";

/** The board's columns, as the table's status filter: both views group jobs the same way. */
export type StatusFilter = "all" | BoardColumn;
export type ListSort = "lastRun" | "name";
export type ListView = "table" | "board";
export type OwnerFilter = "any" | "mine";

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
    /** Table or board; switching keeps every filter. */
    view: ListView;
    /** Any owner, or the jobs the signed-in login created. */
    owner: OwnerFilter;
    /** The signed-in identity's id, for "mine"; null until known. */
    identityId: string | null;
    /** Each board column's order. */
    columnOrder: Record<BoardColumn, SortOrder>;
    /** Board columns opened past their first cards by "Show more". */
    expanded: BoardColumn[];
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
    setView(view: ListView): void;
    setOwner(owner: OwnerFilter): void;
    setIdentityId(id: string | null): void;
    toggleColumnOrder(column: BoardColumn): void;
    expandColumn(column: BoardColumn): void;
    /** The gate banner's link: the signed-in login's jobs that wait for their next stage. */
    showMineWaiting(): void;
}

export const ExtractionListPresenter = createAbstraction<IExtractionListPresenter>(
    "ComponentExtraction/ExtractionListPresenter"
);

export namespace ExtractionListPresenter {
    export type Interface = IExtractionListPresenter;
    export type ViewModel = IExtractionListVm;
}
