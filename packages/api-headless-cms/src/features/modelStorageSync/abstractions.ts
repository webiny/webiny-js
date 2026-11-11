import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

export interface IModelStorageSyncRunParams {
    /* Where the previous step stopped; null on the first step. Opaque: only the storage reads it. */
    cursor: string | null;
    /* Stop starting new batches after this time (ms since epoch). */
    deadline: number;
}

export interface IModelStorageSyncRunResult {
    done: boolean;
    cursor: string | null;
}

/**
 * Brings a storage's own indexes in line with a changed model: work a model change leaves on
 * existing entries (filling a new sort index, clearing a deleted field's index, rebuilding rows for
 * new search settings). The application layer only knows "this model changed": the storage works
 * out what to do from its own state, so any number of calls with any cursor converge.
 *
 * Optional: storages whose indexes need no work on a model change (DynamoDB, OpenSearch) don't
 * register one.
 */
export interface IModelStorageSync {
    /* Cheap: whether `run` has anything to do for this model. */
    needsSync(model: CmsModel): Promise<boolean>;
    /* One bounded step. */
    run(model: CmsModel, params: IModelStorageSyncRunParams): Promise<IModelStorageSyncRunResult>;
}

export const ModelStorageSync = createAbstraction<IModelStorageSync>("Cms/ModelStorageSync");

export namespace ModelStorageSync {
    export type Interface = IModelStorageSync;
    export type RunParams = IModelStorageSyncRunParams;
    export type RunResult = IModelStorageSyncRunResult;
}

/* Input of the `cmsModelStorageSync` task. */
export interface IModelStorageSyncTaskInput {
    modelId: string;
    cursor?: string | null;
    [key: string]: unknown;
}

export const MODEL_STORAGE_SYNC_TASK = "cmsModelStorageSync";
