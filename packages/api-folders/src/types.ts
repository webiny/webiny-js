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

export interface GetFolderParams {
    id: string;
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

export interface StorageOperationsGetFolderParams {
    id?: string;
    slug?: string;
    category?: Category;
    tenant: string;
    locale: string;
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

export interface Entry {
    id: string;
    externalId: string;
    folderId: string;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
    webinyVersion: string;
}

export type EntryInput = Pick<Entry, "externalId" | "folderId">;

export interface ListEntriesWhere {
    folderId: string;
}

export interface ListEntriesParams {
    where: ListEntriesWhere;
}

export interface CreateEntryParams {
    entry: Entry;
}

export interface UpdateEntryParams {
    original: Entry;
    entry: Entry;
}

export interface DeleteEntryParams {
    entry: Entry;
}

export interface StorageOperationsGetEntryParams {
    id?: string;
    externalId?: string;
    folderId?: string;
    tenant: string;
    locale: string;
}

export interface StorageOperationsListEntriesParams extends ListEntriesParams {
    where: ListEntriesParams["where"] & {
        tenant: string;
        locale: string;
    };
    sort: string[];
}

export type StorageOperationsCreateEntryParams = CreateEntryParams;
export type StorageOperationsUpdateEntryParams = UpdateEntryParams;
export type StorageOperationsDeleteEntryParams = DeleteEntryParams;

export interface FoldersContext extends BaseContext, I18NContext, TenancyContext, SecurityContext {
    folders: Folders;
}

export type Folders = IFolders & IEntries;

export interface IFolders {
    getFolder(params: GetFolderParams): Promise<Folder>;
    listFolders(params: ListFoldersParams): Promise<Folder[]>;
    createFolder(input: FolderInput): Promise<Folder>;
    updateFolder(id: string, input: Partial<Folder>): Promise<Folder>;
    deleteFolder(id: string): Promise<void>;
}

export interface IEntries {
    getEntry(id: string): Promise<Entry>;
    listEntries(params: ListEntriesParams): Promise<Entry[]>;
    createEntry(input: EntryInput): Promise<Entry>;
    updateEntry(id: string, input: Partial<Entry>): Promise<Entry>;
    deleteEntry(id: string): Promise<void>;
}

export interface FoldersConfig {
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    storageOperations: FoldersStorageOperations;
}

export interface FoldersStorageOperations {
    // Folders
    getFolder(params: StorageOperationsGetFolderParams): Promise<Folder>;
    listFolders(params: StorageOperationsListFoldersParams): Promise<Folder[]>;
    createFolder(params: StorageOperationsCreateFolderParams): Promise<Folder>;
    updateFolder(params: StorageOperationsUpdateFolderParams): Promise<Folder>;
    deleteFolder(params: StorageOperationsDeleteFolderParams): Promise<void>;
    // Entries
    getEntry(params: StorageOperationsGetEntryParams): Promise<Entry>;
    listEntries(params: StorageOperationsListEntriesParams): Promise<Entry[]>;
    createEntry(params: StorageOperationsCreateEntryParams): Promise<Entry>;
    updateEntry(params: StorageOperationsUpdateEntryParams): Promise<Entry>;
    deleteEntry(params: StorageOperationsDeleteEntryParams): Promise<void>;
}
