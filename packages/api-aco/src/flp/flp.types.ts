import { type Folder } from "~/types.js";
import type { FolderLevelPermission, FolderPermission } from "@webiny/shared-aco/flp/flp.types.js";

export type * from "@webiny/shared-aco/flp/flp.types.js";

/********
 * CRUD operations
 *******/

export interface ListFlpsParams {
    where: {
        path_startsWith?: string;
        parentId?: string;
        type: string;
    };
}

export type CreateFlpParams = Pick<
    FolderLevelPermission,
    "id" | "type" | "permissions" | "path" | "parentId" | "slug"
>;

export interface UpdateFlpParams {
    parentId?: string;
    slug?: string;
    path?: string;
    permissions?: FolderPermission[];
    type?: string;
}

export interface AcoFolderLevelPermissionsCrud {
    list(params: ListFlpsParams): Promise<FolderLevelPermission[]>;
    get(id: string): Promise<FolderLevelPermission | null>;
    create(params: CreateFlpParams): Promise<FolderLevelPermission>;
    update(id: string, data: UpdateFlpParams): Promise<FolderLevelPermission>;
    delete(id: string): Promise<boolean>;
    batchUpdate(
        items: Array<{ id: string; data: UpdateFlpParams }>
    ): Promise<FolderLevelPermission[]>;
}

/********
 * Storage operations
 *******/

export interface StorageOperationsListFlpsParams {
    where: ListFlpsParams["where"] & {
        tenant: string;
        locale: string;
    };
}

export interface StorageOperationsGetFlpParams {
    id: string;
    tenant: string;
    locale: string;
}

export type StorageOperationsCreateFlpParams = {
    data: FolderLevelPermission & {
        tenant: string;
        locale: string;
    };
};

export type StorageOperationsUpdateFlpParams = {
    original: FolderLevelPermission;
    data: UpdateFlpParams & {
        tenant: string;
        locale: string;
    };
};

export type StorageOperationsDeleteFlpParams = {
    flp: FolderLevelPermission & {
        tenant: string;
        locale: string;
    };
};

export interface StorageOperationsBatchUpdateFlpParams {
    items: Array<{
        original: FolderLevelPermission;
        data: UpdateFlpParams & {
            tenant: string;
            locale: string;
        };
    }>;
}

export interface AcoFolderLevelPermissionsStorageOperations {
    list(params: StorageOperationsListFlpsParams): Promise<FolderLevelPermission[]>;
    get(params: StorageOperationsGetFlpParams): Promise<FolderLevelPermission | null>;
    create(params: StorageOperationsCreateFlpParams): Promise<FolderLevelPermission>;
    update(params: StorageOperationsUpdateFlpParams): Promise<FolderLevelPermission>;
    delete(params: StorageOperationsDeleteFlpParams): Promise<void>;
    batchUpdate(params: StorageOperationsBatchUpdateFlpParams): Promise<FolderLevelPermission[]>;
}

/********
 *  Background Tasks
 *******/

export interface ICreateFlpTaskInput {
    folder: Folder;
}

export interface IUpdateFlpTaskInput {
    folder: Folder;
    queued?: string[];
}

export interface IDeleteFlpTaskInput {
    folder: Folder;
}

export interface ISyncFlpTaskInput {
    type?: string;
    folderId?: string;
}
