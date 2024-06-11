import { CmsContext } from "@webiny/api-headless-cms/types";
import { Context as BaseContext } from "@webiny/handler/types";
import {
    Context as TasksContext,
    ITaskResponseDoneResultOutput,
    ITaskRunParams
} from "@webiny/tasks/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface HcmsTasksContext extends BaseContext, CmsContext, TasksContext {}

export enum EntriesTask {
    EmptyTrashBins = "hcmsEntriesEmptyTrashBins",
    DeleteEntriesByModel = "hcmsEntriesDeleteEntriesByModel",
    DeleteEntries = "hcmsEntriesDeleteEntries",
    PublishEntriesByModel = "hcmsEntriesPublishEntriesByModel",
    PublishEntries = "hcmsEntriesPublishEntries",
    UnpublishEntriesByModel = "hcmsEntriesUnpublishEntriesByModel",
    UnpublishEntries = "hcmsEntriesUnpublishEntries",
    MoveEntriesToFolderByModel = "hcmsEntriesMoveEntriesToFolderByModel",
    MoveEntriesToFolder = "hcmsEntriesMoveEntriesToFolder",
    MoveEntriesToTrashByModel = "hcmsEntriesMoveEntriesToTrashByModel",
    MoveEntriesToTrash = "hcmsEntriesMoveEntriesToTrash",
    RestoreEntriesFromTrashByModel = "hcmsEntriesRestoreEntriesFromTrashByModel",
    RestoreEntriesFromTrash = "hcmsEntriesRestoreEntriesFromTrash"
}

/**
 * Empty Trash Bins
 */

export type IEmptyTrashBins = ITaskRunParams<HcmsTasksContext>;

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
    HcmsTasksContext,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
>;

/**
 * Bulk Action Operation By Model
 */

export interface IBulkActionOperationByModelInput {
    modelId: string;
    identity?: SecurityIdentity;
    where?: Record<string, any>;
    data?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
    totalCount?: number;
}

export interface IBulkActionOperationByModelOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IBulkActionOperationByModelTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
>;
