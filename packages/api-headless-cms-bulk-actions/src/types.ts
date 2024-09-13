import { CmsContext } from "@webiny/api-headless-cms/types";
import { Context as BaseContext } from "@webiny/handler/types";
import {
    Context as TasksContext,
    ITaskResponseDoneResultOutput,
    ITaskRunParams
} from "@webiny/tasks/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface HcmsBulkActionsContext extends BaseContext, CmsContext, TasksContext {}

/**
 * Bulk Action Operation
 */

export interface IBulkActionOperationInput {
    modelId: string;
    ids: string[];
    data?: Record<string, any>;
    identity: SecurityIdentity;
    done?: string[];
    failed?: string[];
}

export interface IBulkActionOperationOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IBulkActionOperationTaskParams = ITaskRunParams<
    HcmsBulkActionsContext,
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
    identity?: SecurityIdentity;
    where?: Record<string, any>;
    search?: string;
    data?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    totalCount?: number;
    action?: BulkActionOperationByModelAction;
}

export interface IBulkActionOperationByModelOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IBulkActionOperationByModelTaskParams = ITaskRunParams<
    HcmsBulkActionsContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
>;
