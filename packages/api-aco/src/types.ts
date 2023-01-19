import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import { Topic } from "@webiny/pubsub/types";

export interface CreatedBy {
    id: string;
    type: string;
    displayName: string | null;
}

export interface ListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export interface Folder {
    id: string;
    name: string;
    slug: string;
    type: string;
    parentId?: string | null;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
    webinyVersion: string;
}

export type FolderInput = Pick<Folder, "name" | "slug" | "type" | "parentId">;
export type FolderUpdateInput = Pick<Folder, "name" | "slug" | "parentId">;

export interface GetFolderParams {
    id: string;
}

export interface ListFoldersWhere {
    type: string;
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
    type?: string;
    parentId?: string | null;
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

export interface OnFolderBeforeCreateTopicParams {
    folder: Folder;
}

export interface OnFolderAfterCreateTopicParams {
    folder: Folder;
}

export interface OnFolderBeforeUpdateTopicParams {
    folder: Folder;
    original: Folder;
}

export interface OnFolderAfterUpdateTopicParams {
    folder: Folder;
    original: Folder;
}

export interface OnFolderBeforeDeleteTopicParams {
    folder: Folder;
}

export interface OnFolderAfterDeleteTopicParams {
    folder: Folder;
}

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
    limit?: number;
    after?: string | null;
}

export type ListLinksResponse = [Link[], ListMeta];

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

export interface DeleteLinksParams {
    tenant: string;
    locale: string;
    folderIds: string[];
}

export interface StorageOperationsGetLinkParams {
    id?: string;
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

export type StorageOperationListLinksResponse = ListLinksResponse;

export type StorageOperationsCreateLinkParams = CreateLinkParams;
export type StorageOperationsUpdateLinkParams = UpdateLinkParams;
export type StorageOperationsDeleteLinkParams = DeleteLinkParams;
export type StorageOperationsDeleteLinksParams = DeleteLinksParams;

export interface OnLinkBeforeCreateTopicParams {
    link: Link;
}

export interface OnLinkAfterCreateTopicParams {
    link: Link;
}

export interface OnLinkBeforeUpdateTopicParams {
    link: Link;
    original: Link;
}

export interface OnLinkAfterUpdateTopicParams {
    link: Link;
    original: Link;
}

export interface OnLinkBeforeDeleteTopicParams {
    link: Link;
}

export interface OnLinkAfterDeleteTopicParams {
    link: Link;
}

export interface OnLinkBeforeDeleteBatchTopicParams {
    folderIds: string[];
}

export interface OnLinkAfterDeleteBatchTopicParams {
    folderIds: string[];
}

export interface ACOContext
    extends BaseContext,
        I18NContext,
        TenancyContext,
        SecurityContext,
        PbContext {
    folders: Folders;
}

export type Folders = IFolders & ILinks;

export interface IFolders {
    getFolder(params: GetFolderParams): Promise<Folder>;
    listFolders(params: ListFoldersParams): Promise<Folder[]>;
    createFolder(input: FolderInput): Promise<Folder>;
    updateFolder(id: string, input: Partial<Folder>): Promise<Folder>;
    deleteFolder(id: string): Promise<void>;
    onFolderBeforeCreate: Topic<OnFolderBeforeCreateTopicParams>;
    onFolderAfterCreate: Topic<OnFolderAfterCreateTopicParams>;
    onFolderBeforeUpdate: Topic<OnFolderBeforeUpdateTopicParams>;
    onFolderAfterUpdate: Topic<OnFolderAfterUpdateTopicParams>;
    onFolderBeforeDelete: Topic<OnFolderBeforeDeleteTopicParams>;
    onFolderAfterDelete: Topic<OnFolderAfterDeleteTopicParams>;
}

export interface ILinks {
    getLink(id: string): Promise<Link>;
    listLinks(params: ListLinksParams): Promise<ListLinksResponse>;
    createLink(input: LinkInput): Promise<Link>;
    updateLink(id: string, input: Partial<Link>): Promise<Link>;
    deleteLink(id: string): Promise<void>;
    deleteLinks(folderIds: string[]): Promise<void>;
    onLinkBeforeCreate: Topic<OnLinkBeforeCreateTopicParams>;
    onLinkAfterCreate: Topic<OnLinkAfterCreateTopicParams>;
    onLinkBeforeUpdate: Topic<OnLinkBeforeUpdateTopicParams>;
    onLinkAfterUpdate: Topic<OnLinkAfterUpdateTopicParams>;
    onLinkBeforeDelete: Topic<OnLinkBeforeDeleteTopicParams>;
    onLinkAfterDelete: Topic<OnLinkAfterDeleteTopicParams>;
    onLinkBeforeDeleteBatch: Topic<OnLinkBeforeDeleteBatchTopicParams>;
    onLinkAfterDeleteBatch: Topic<OnLinkAfterDeleteBatchTopicParams>;
}

export interface FoldersConfig {
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    storageOperations: StorageOperations;
}

export type StorageOperations = FoldersStorageOperations & LinksStorageOperations;

export interface FoldersStorageOperations {
    getFolder(params: StorageOperationsGetFolderParams): Promise<Folder | undefined>;
    listFolders(params: StorageOperationsListFoldersParams): Promise<Folder[]>;
    createFolder(params: StorageOperationsCreateFolderParams): Promise<Folder>;
    updateFolder(params: StorageOperationsUpdateFolderParams): Promise<Folder>;
    deleteFolder(params: StorageOperationsDeleteFolderParams): Promise<void>;
}

export interface LinksStorageOperations {
    getLink(params: StorageOperationsGetLinkParams): Promise<Link | undefined>;
    listLinks(params: StorageOperationsListLinksParams): Promise<StorageOperationListLinksResponse>;
    createLink(params: StorageOperationsCreateLinkParams): Promise<Link>;
    updateLink(params: StorageOperationsUpdateLinkParams): Promise<Link>;
    deleteLink(params: StorageOperationsDeleteLinkParams): Promise<void>;
    deleteLinks(params: StorageOperationsDeleteLinksParams): Promise<void>;
}
