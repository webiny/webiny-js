import { createAbstraction } from "@webiny/feature/api";
import type { Operations } from "../Operations/abstractions/Operations.js";
import type { ExecuteSyncWithRetry } from "../ExecuteSyncWithRetry/abstraction.js";

export interface ISynchronizationBuilder {
    insert(params: Operations.InsertParams): void;
    modify(params: Operations.ModifyParams): void;
    delete(params: Operations.DeleteParams): void;
    build(): (params?: Partial<ExecuteSyncWithRetry.Params>) => Promise<void>;
}

export const SynchronizationBuilder = createAbstraction<ISynchronizationBuilder>(
    "Sync/SynchronizationBuilder"
);

export namespace SynchronizationBuilder {
    export type Interface = ISynchronizationBuilder;
}
