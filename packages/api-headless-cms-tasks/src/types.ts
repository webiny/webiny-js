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
 * Delete Entries by Model
 */

export interface IDeleteEntriesByModelInput {
    modelId: string;
    identity: SecurityIdentity;
    where?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
    totalCount?: number;
}

export interface IDeleteEntriesByModelOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IDeleteEntriesByModelTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IDeleteEntriesByModelInput,
    IDeleteEntriesByModelOutput
>;

/**
 * Publish Entries by Model
 */

export interface IPublishEntriesByModelInput {
    modelId: string;
    identity: SecurityIdentity;
    where?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
    totalCount?: number;
}

export interface IPublishEntriesByModelOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IPublishEntriesByModelTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IPublishEntriesByModelInput,
    IPublishEntriesByModelOutput
>;

/**
 * Unpublish Entries by Model
 */

export interface IUnpublishEntriesByModelInput {
    modelId: string;
    identity: SecurityIdentity;
    where?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
    totalCount?: number;
}

export interface IUnpublishEntriesByModelOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IUnpublishEntriesByModelTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IUnpublishEntriesByModelInput,
    IUnpublishEntriesByModelOutput
>;

/**
 * Move Entries to Folder by Model
 */

export interface IMoveEntriesToFolderByModelInput {
    modelId: string;
    identity: SecurityIdentity;
    folderId: string;
    where?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
    totalCount?: number;
}

export interface IMoveEntriesToFolderByModelOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IMoveEntriesToFolderByModelTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IMoveEntriesToFolderByModelInput,
    IMoveEntriesToFolderByModelOutput
>;

/**
 * Move Entries to Trash by Model
 */

export interface IMoveEntriesToTrashByModelInput {
    modelId: string;
    identity: SecurityIdentity;
    where?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
    totalCount?: number;
}

export interface IMoveEntriesToTrashByModelOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IMoveEntriesToTrashByModelTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IMoveEntriesToTrashByModelInput,
    IMoveEntriesToTrashByModelOutput
>;

/**
 * Restore Entries from Trash Bin by Model
 */

export interface IRestoreEntriesFromTrashByModelInput {
    modelId: string;
    identity: SecurityIdentity;
    where?: Record<string, any>;
    after?: string | null;
    currentBatch?: number;
    processing?: boolean;
    totalCount?: number;
}

export interface IRestoreEntriesFromTrashByModelOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IRestoreEntriesFromTrashByModelTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IRestoreEntriesFromTrashByModelInput,
    IRestoreEntriesFromTrashByModelOutput
>;

/**
 * Bulk Action Operation
 */

export interface IBulkActionOperationInput {
    modelId: string;
    entryIds: string[];
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
 * Bulk Action Operation // Move Entries to Folder
 */

export interface IBulkActionMoveEntriesToFolderOperationInput extends IBulkActionOperationInput {
    folderId: string;
}

export type IBulkActionMoveEntriesToFolderOperationTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IBulkActionMoveEntriesToFolderOperationInput,
    IBulkActionOperationOutput
>;
