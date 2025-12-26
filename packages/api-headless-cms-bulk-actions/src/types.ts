import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { Context as BaseContext } from "@webiny/handler/types.js";
import type { Context as TasksContext, ITaskIdentity } from "@webiny/tasks/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface HcmsBulkActionsContext extends BaseContext, CmsContext, TasksContext {}

/**
 * Bulk Action Operation
 */

export interface IBulkActionOperationInput {
    modelId: string;
    ids: string[];
    data?: Record<string, any>;
    identity: ITaskIdentity;
    done?: string[];
    failed?: string[];
}

export interface IBulkActionOperationOutput {
    done: string[];
    failed: string[];
}

export type IBulkActionOperationTaskParams = TaskDefinition.RunParams<
    IBulkActionOperationInput,
    IBulkActionOperationOutput
>;

/**
 * Bulk Action Operation By Model
 */

export enum BulkActionOperationByModelAction {
    CREATE_SUBTASKS = "CREATE_SUBTASKS",
    CHECK_MORE_SUBTASKS = "CHECK_MORE_SUBTASKS",
    PROCESS_SUBTASKS = "PROCESS_SUBTASKS",
    END_TASK = "END_TASK"
}

export interface IBulkActionOperationByModelInput {
    modelId: string;
    identity?: ITaskIdentity;
    where?: Record<string, any>;
    search?: string;
    after?: string | null;
    data?: Record<string, any>;
    action?: BulkActionOperationByModelAction;
}

export interface IBulkActionOperationByModelOutput {
    done: string[];
    failed: string[];
}

export type IBulkActionOperationByModelTaskParams = TaskDefinition.RunParams<
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
>;

/**
 * Empty Trash Bin
 */

export interface IEmptyTrashBinsInput {
    executedTenantIds?: string[] | null;
}

export type IEmptyTrashBinsOutput = TaskDefinition.ResultDone;

export type IEmptyTrashBinsTaskParams = TaskDefinition.RunParams<
    IEmptyTrashBinsInput,
    IEmptyTrashBinsOutput
>;
