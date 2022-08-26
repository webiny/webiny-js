import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";

export interface GetTenantId {
    (): string;
}

export interface GetLocaleCode {
    (): string;
}

export interface CreatedBy {
    id: string;
    type: string;
    displayName: string | null;
}

export type Type = "pages" | "cms" | "files";

export interface Folder {
    id: string;
    name: string;
    slug: string;
    type: Type;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
    webinyVersion: string;
}

export type FolderInput = Pick<Folder, "name" | "slug" | "type">;

export interface FoldersConfig {
    getTenantId: GetTenantId;
    getLocaleCode: GetLocaleCode;
    storageOperations: FoldersStorageOperations;
}

export interface FoldersContext extends BaseContext, I18NContext, TenancyContext {
    folders: Folders;
}

export interface Folders {
    getFolder(params: GetFolderParams): Promise<Folder>;
    createFolder(input: FolderInput): Promise<Folder>;
}

export interface FoldersStorageOperations {
    getFolder(params: StorageOperationsGetFolderParams): Promise<Folder | null>;
    createFolder(params: StorageOperationsCreateFolderParams): Promise<Folder>;
}

export interface GetFolderWhere {
    id?: string;
    slug?: string;
    tenant?: string;
    locale?: string;
    type?: string;
}

export interface GetFolderParams {
    where: GetFolderWhere;
}

export interface CreateFolderParams {
    folder: Folder;
}

export interface StorageOperationsGetFolderParams extends GetFolderParams {
    where: GetFolderParams["where"] & {
        tenant: string;
        locale: string;
    };
}

export type StorageOperationsCreateFolderParams = CreateFolderParams;
