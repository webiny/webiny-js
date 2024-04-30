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
    EmptyTrashBinByModel = "hcmsEntriesEmptyTrashBinByModel",
    DeleteEntries = "hcmsEntriesDeleteEntries",
    PublishEntriesByModel = "hcmsEntriesPublishEntriesByModel",
    PublishEntries = "hcmsEntriesPublishEntries",
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

export interface IDeleteEntriesInput {
    modelId: string;
    entryIds: string[];
    done?: string[];
    failed?: string[];
}

export interface IDeleteEntriesOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IDeleteEntriesTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IDeleteEntriesInput,
    IDeleteEntriesOutput
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
 * Publish Entries
 */

export interface IPublishEntriesInput {
    modelId: string;
    ids: string[];
    identity: SecurityIdentity;
    done?: string[];
    failed?: string[];
}

export interface IPublishEntriesOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IPublishEntriesTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IPublishEntriesInput,
    IPublishEntriesOutput
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
 * Unpublish Entries
 */

export interface IUnpublishEntriesInput {
    modelId: string;
    ids: string[];
    identity: SecurityIdentity;
    done?: string[];
    failed?: string[];
}

export interface IUnpublishEntriesOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IUnpublishEntriesTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IUnpublishEntriesInput,
    IUnpublishEntriesOutput
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
 * Move Entries to Folder
 */

export interface IMoveEntriesToFolderInput {
    modelId: string;
    ids: string[];
    folderId: string;
    identity: SecurityIdentity;
    done?: string[];
    failed?: string[];
}

export interface IMoveEntriesToFolderOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IMoveEntriesToFolderTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IMoveEntriesToFolderInput,
    IMoveEntriesToFolderOutput
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
 * Move Entries to Trash
 */

export interface IMoveEntriesToTrashInput {
    modelId: string;
    entryIds: string[];
    identity: SecurityIdentity;
    done?: string[];
    failed?: string[];
}

export interface IMoveEntriesToTrashOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IMoveEntriesToTrashTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IMoveEntriesToTrashInput,
    IMoveEntriesToTrashOutput
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
 * Restore Entries from Trash
 */

export interface IRestoreEntriesFromTrashInput {
    modelId: string;
    entryIds: string[];
    identity: SecurityIdentity;
    done?: string[];
    failed?: string[];
}

export interface IRestoreEntriesFromTrashOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
}

export type IRestoreEntriesFromTrashTaskParams = ITaskRunParams<
    HcmsTasksContext,
    IRestoreEntriesFromTrashInput,
    IRestoreEntriesFromTrashOutput
>;
