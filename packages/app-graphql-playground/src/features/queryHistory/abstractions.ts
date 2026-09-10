import { createAbstraction } from "@webiny/feature/admin";

export interface IHistoryEntry {
    id: string;
    query: string;
    variables: string;
    endpoint: string;
    definitionId: string;
    timestamp: number;
}

export interface IQueryHistoryRepository {
    record(entry: Omit<IHistoryEntry, "id" | "timestamp">): void;
    remove(id: string): void;
    clear(): void;
    getAll(): IHistoryEntry[];
}

export const QueryHistoryRepository =
    createAbstraction<IQueryHistoryRepository>("QueryHistoryRepository");

export namespace QueryHistoryRepository {
    export type Interface = IQueryHistoryRepository;
    export type Entry = IHistoryEntry;
}
