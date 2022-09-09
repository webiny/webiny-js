import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";

export interface CreatedBy {
    id: string;
    type: string;
    displayName: string | null;
}

export enum Type {
    PAGE = "page",
    CMS = "cms",
    FILE = "file"
}

export interface Folder {
    id: string;
    name: string;
    slug: string;
    type: Type;
    parentId?: string;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
    webinyVersion: string;
}

export type FolderInput = Pick<Folder, "name" | "slug" | "type" | "parentId">;

export interface GetFolderParams {
    id: string;
}

export interface ListFoldersWhere {
    type: Type;
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
    type?: Type;
    parentId?: string;
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

export interface Link {
    id: string;
    linkId: string;
    folderId: string;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
    webinyVersion: string;
}

export type LinkInput = Pick<Link, "id" | "folderId">;

export interface ListLinksWhere {
    folderId: string;
}

export interface ListLinksParams {
    where: ListLinksWhere;
}

export interface CreateLinkParams {
    link: Link;
}

export interface UpdateLinkParams {
    original: Link;
    link: Link;
}

export interface DeleteLinkParams {
    link: Link;
}

export interface StorageOperationsGetLinkParams {
    id?: string;
    eId?: string;
    folderId?: string;
    tenant: string;
    locale: string;
}

export interface StorageOperationsListLinksParams extends ListLinksParams {
    where: ListLinksParams["where"] & {
        tenant: string;
        locale: string;
    };
    sort: string[];
}

export type StorageOperationsCreateLinkParams = CreateLinkParams;
export type StorageOperationsUpdateLinkParams = UpdateLinkParams;
export type StorageOperationsDeleteLinkParams = DeleteLinkParams;

export interface FoldersContext extends BaseContext, I18NContext, TenancyContext, SecurityContext {
    folders: Folders;
}

export type Folders = IFolders & ILinks;

export interface IFolders {
    getFolder(params: GetFolderParams): Promise<Folder>;
    listFolders(params: ListFoldersParams): Promise<Folder[]>;
    createFolder(input: FolderInput): Promise<Folder>;
    updateFolder(id: string, input: Partial<Folder>): Promise<Folder>;
    deleteFolder(id: string): Promise<void>;
}

export interface ILinks {
    getLink(id: string): Promise<Link>;
    listLinks(params: ListLinksParams): Promise<Link[]>;
    createLink(input: LinkInput): Promise<Link>;
    updateLink(id: string, input: Partial<Link>): Promise<Link>;
    deleteLink(id: string): Promise<void>;
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
    // EnLink
    getLink(params: StorageOperationsGetLinkParams): Promise<Link>;
    listLinks(params: StorageOperationsListLinksParams): Promise<Link[]>;
    createLink(params: StorageOperationsCreateLinkParams): Promise<Link>;
    updateLink(params: StorageOperationsUpdateLinkParams): Promise<Link>;
    deleteLink(params: StorageOperationsDeleteLinkParams): Promise<void>;
}
