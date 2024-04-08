import { CmsContext } from "@webiny/api-headless-cms/types";
import { Context as BaseContext } from "@webiny/handler/types";
import {
    Context as TasksContext,
    ITaskResponseDoneResultOutput,
    ITaskRunParams
} from "@webiny/tasks/types";

export interface HeadlessCmsTasksContext extends BaseContext, CmsContext, TasksContext {}

export enum EntriesTask {
    EmptyTrashBins = "emptyTrashBins",
    EmptyTrashBinByModel = "emptyTrashBinByModel",
    DeleteTrashBinEntries = "deleteTrashBinEntries"
}

/**
 * Empty Trash Bin by Model
 */

export interface IEmptyTrashBinByModelInput {
    modelId: string;
    where?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
    totalCount?: number;
}

export interface IEmptyTrashBinByModelOutput extends ITaskResponseDoneResultOutput {
    totalCount: number;
    done: string[];
    failed: string[];
}

export type IEmptyTrashBinByModelTaskParams = ITaskRunParams<
    HeadlessCmsTasksContext,
    IEmptyTrashBinByModelInput,
    IEmptyTrashBinByModelOutput
>;

/**
 * Delete Trash Bin Entries
 */

export interface IDeleteTrashBinEntriesInput {
    modelId: string;
    entryIds: string[];
    done?: string[];
    failed?: string[];
}

export interface IDeleteTrashBinEntriesOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}
