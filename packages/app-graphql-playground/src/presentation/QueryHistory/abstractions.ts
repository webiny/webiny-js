import { createAbstraction } from "@webiny/feature/admin";

export interface IHistoryEntryVm {
    id: string;
    queryPreview: string;
    endpoint: string;
    definitionId: string;
    timestamp: number;
    query: string;
    variables: string;
}

export interface IQueryHistoryVm {
    open: boolean;
    searchQuery: string;
    entries: IHistoryEntryVm[];
}

export interface IQueryHistoryPresenter {
    readonly vm: IQueryHistoryVm;
    toggle(): void;
    setSearchQuery(query: string): void;
    remove(id: string): void;
    clear(): void;
    load(): void;
    refresh(): void;
}

export const QueryHistoryPresenter =
    createAbstraction<IQueryHistoryPresenter>("QueryHistoryPresenter");

export namespace QueryHistoryPresenter {
    export type Interface = IQueryHistoryPresenter;
    export type Vm = IQueryHistoryVm;
    export type EntryVm = IHistoryEntryVm;
}
