import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";

export interface CreatedBy {
    id: string;
    type: string;
    displayName: string | null;
}

export enum Category {
    PAGE = "page",
    CMS = "cms",
    FILE = "file"
}
export interface Folder {
    id: string;
    name: string;
    slug: string;
    category: Category;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
    webinyVersion: string;
}

export type FolderInput = Pick<Folder, "name" | "slug" | "category">;

export interface FoldersConfig {
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    storageOperations: FoldersStorageOperations;
}

export interface FoldersContext extends BaseContext, I18NContext, TenancyContext, SecurityContext {
    folders: Folders;
}

export interface Folders {
    getFolder(params: GetFolderParams): Promise<Folder>;
    listFolders(params: ListFoldersParams): Promise<Folder[]>;
    createFolder(input: FolderInput): Promise<Folder>;
    updateFolder(id: string, input: Partial<Folder>): Promise<Folder>;
    deleteFolder(id: string): Promise<void>;
}

export interface FoldersStorageOperations {
    getFolder(params: StorageOperationsGetFolderParams): Promise<Folder>;
    listFolders(params: StorageOperationsListFoldersParams): Promise<Folder[]>;
    createFolder(params: StorageOperationsCreateFolderParams): Promise<Folder>;
    updateFolder(params: StorageOperationsUpdateFolderParams): Promise<Folder>;
    deleteFolder(params: StorageOperationsDeleteFolderParams): Promise<void>;
}

export interface GetFolderWhere {
    id?: string;
    slug?: string;
    tenant?: string;
    locale?: string;
    category?: Category;
}

export interface GetFolderParams {
    where: GetFolderWhere;
}

export interface ListFoldersWhere {
    category: Category;
}

export interface ListFoldersParams {
    where: ListFoldersWhere;
}

export interface CreateFolderParams {
    folder: Folder;
}

export interface UpdateFolderParams {
    original: Folder;
    folder: Folder;
}

export interface DeleteFolderParams {
    folder: Folder;
}

export interface StorageOperationsGetFolderParams extends GetFolderParams {
    where: GetFolderParams["where"] & {
        tenant: string;
        locale: string;
    };
}

export interface StorageOperationsListFoldersParams extends ListFoldersParams {
    where: ListFoldersParams["where"] & {
        tenant: string;
        locale: string;
    };
    sort: string[];
}

export type StorageOperationsCreateFolderParams = CreateFolderParams;
export type StorageOperationsUpdateFolderParams = UpdateFolderParams;
export type StorageOperationsDeleteFolderParams = DeleteFolderParams;
