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
    DeleteTrashBinEntries = "hcmsEntriesDeleteTrashBinEntries",
    PublishEntriesByModel = "hcmsEntriesPublishEntriesByModel",
    PublishEntries = "hcmsEntriesPublishEntries",
    UnpublishEntries = "hcmsEntriesUnpublishEntries",
    MoveEntriesToFolder = "hcmsEntriesMoveEntriesToFolder"
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
