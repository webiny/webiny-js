import { Context as BaseContext } from "@webiny/handler/types";
import { CmsEntry, HeadlessCms } from "@webiny/api-headless-cms/types";
import {
    Context as TasksContext,
    ITaskResponseDoneResultOutput,
    ITaskRunParams
} from "@webiny/tasks/types";

export interface HeadlessCmsTasksContext extends BaseContext, HeadlessCms, TasksContext {}

export enum DeleteEntriesTask {
    Controller = "deleteEntriesController",
    Process = "deleteEntriesProcess"
}

/**
 * Delete entries - Controller
 */
export interface IDeleteEntriesControllerInput {
    modelId: string;
    where?: Record<string, any>;
    totalEntries: number;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
}

export interface IDeleteEntriesControllerOutput extends ITaskResponseDoneResultOutput {
    totalEntries: number;
}

export type IDeleteEntriesControllerTaskParams = ITaskRunParams<
    HeadlessCmsTasksContext,
    IDeleteEntriesControllerInput,
    IDeleteEntriesControllerOutput
>;

/**
 * Delete entries - Process entries
 */
export interface IDeleteEntriesProcessEntriesInput {
    modelId: string;
    entries: CmsEntry[];
    done?: CmsEntry[];
    failed?: CmsEntry[];
}

export interface IDeleteEntriesProcessEntriesOutput extends ITaskResponseDoneResultOutput {
    done: CmsEntry[];
    failed: CmsEntry[];
}

export type IDeleteEntriesProcessEntriesTaskParams = ITaskRunParams<
    HeadlessCmsTasksContext,
    IDeleteEntriesProcessEntriesInput,
    IDeleteEntriesProcessEntriesOutput
>;
