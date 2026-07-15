import { createAbstraction } from "@webiny/feature/api";
import type { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import type { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { Operations } from "../Operations/abstraction.js";

export interface IExecuteSyncParams {
    timer: Timer.Interface;
    maxRunningTime: number;
    maxProcessorPercent: number;
    openSearchClient: OpenSearchClient.Client;
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
