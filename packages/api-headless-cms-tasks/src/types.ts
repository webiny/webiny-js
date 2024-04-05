import { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { Context as TasksContext, ITaskResponseDoneResultOutput } from "@webiny/tasks/types";

export interface HeadlessCmsTasksContext extends BaseContext, CmsContext, TasksContext {}

export enum EntriesTask {
    EmptyTrashBins = "emptyTrashBins",
    EmptyTrashBinByModel = "emptyTrashBinByModel"
}

/**
 * Empty Trash Bin by Model
 */

export interface IEmptyTrashBinByModelInput {
    modelId: string;
    where?: Record<string, any>;
}

export interface IEmptyTrashBinByModelOutput extends ITaskResponseDoneResultOutput {
    done: CmsEntry[];
    failed: CmsEntry[];
}
