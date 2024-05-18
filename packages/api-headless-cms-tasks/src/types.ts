import { CmsContext } from "@webiny/api-headless-cms/types";
import { Context as BaseContext } from "@webiny/handler/types";
import {
    Context as TasksContext,
    ITaskResponseDoneResultOutput,
    ITaskRunParams
} from "@webiny/tasks/types";

export interface HcmsTasksContext extends BaseContext, CmsContext, TasksContext {}

export enum EntriesTask {
    EmptyTrashBins = "hcmsEntriesEmptyTrashBins",
    EmptyTrashBinByModel = "hcmsEntriesEmptyTrashBinByModel",
    DeleteTrashBinEntries = "hcmsEntriesDeleteTrashBinEntries"
}

/**
 * Empty Trash Bins
 */

export type IEmptyTrashBins = ITaskRunParams<HcmsTasksContext>;

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
    done: string[];
    failed: string[];
}

export type IEmptyTrashBinByModelTaskParams = ITaskRunParams<
    HcmsTasksContext,
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

export type IDeleteTrashBinEntriesTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IDeleteTrashBinEntriesInput,
    IDeleteTrashBinEntriesOutput
>;
