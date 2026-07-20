import { createAbstraction } from "@webiny/feature/api/index.js";

export interface ISyncTableManager {
    ensureTable(): Promise<void>;
    getTableName(): string;
    reset(): void;
}

export const SyncTableManager = createAbstraction<ISyncTableManager>("Cms/PgOs/SyncTableManager");

export namespace SyncTableManager {
    export type Interface = ISyncTableManager;
}
