import { createAbstraction } from "@webiny/feature/api";
import type { ExecuteSync } from "../ExecuteSync/abstraction.js";

export interface IExecuteSyncWithRetryParams extends Omit<
    ExecuteSync.Params,
    "maxProcessorPercent"
> {
    maxRetryTime?: number;
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
    maxProcessorPercent?: number;
}

export interface IExecuteSyncWithRetry {
    execute(params: IExecuteSyncWithRetryParams): Promise<void>;
}

export const ExecuteSyncWithRetry = createAbstraction<IExecuteSyncWithRetry>(
    "Sync/ExecuteSyncWithRetry"
);

export namespace ExecuteSyncWithRetry {
    export type Interface = IExecuteSyncWithRetry;
    export type Params = IExecuteSyncWithRetryParams;
}
