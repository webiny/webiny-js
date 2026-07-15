import { createAbstraction } from "@webiny/feature/api";
import type {
    IInsertOperationParams,
    IDeleteOperationParams,
    IModifyOperationParams
} from "../Operations/abstraction.js";
import type { ExecuteSyncWithRetry } from "../ExecuteSyncWithRetry/abstraction.js";

export interface ISynchronizationBuilder {
    insert(params: IInsertOperationParams): void;
    modify(params: IModifyOperationParams): void;
    delete(params: IDeleteOperationParams): void;
    build(): (params?: Partial<ExecuteSyncWithRetry.Params>) => Promise<void>;
}

export const SynchronizationBuilder = createAbstraction<ISynchronizationBuilder>(
    "Sync/SynchronizationBuilder"
);

export namespace SynchronizationBuilder {
    export type Interface = ISynchronizationBuilder;
}
