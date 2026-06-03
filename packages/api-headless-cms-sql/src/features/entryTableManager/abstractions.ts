import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IEntryTableManager {
    ensureTable(): Promise<void>;
    getTableName(): string;
    reset(): void;
}

export const EntryTableManager = createAbstraction<IEntryTableManager>("Cms/Sql/EntryTableManager");

export namespace EntryTableManager {
    export type Interface = IEntryTableManager;
}
