import { createAbstraction } from "@webiny/feature/api";
import type { Operations } from "../Operations/abstractions/Operations.js";

export interface IExecuteSyncParams {
    maxRunningTime: number;
    maxProcessorPercent: number;
    operations: Pick<Operations.Interface, "items" | "total">;
}

export interface IExecuteSync {
    execute(params: IExecuteSyncParams): Promise<void>;
}

export const ExecuteSync = createAbstraction<IExecuteSync>("Sync/ExecuteSync");

export namespace ExecuteSync {
    export type Interface = IExecuteSync;
    export type Params = IExecuteSyncParams;
}
