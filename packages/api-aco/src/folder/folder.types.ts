import { ListMeta, ListSort, User } from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";

export interface Folder {
    id: string;
    entryId: string;
    createdOn: string;
    createdBy: User;
    savedOn: string;
    title: string;
    slug: string;
    permissions?: FolderPermission[];
    type: string;
    parentId?: string | null;
}

export interface ListFoldersWhere {
    type: string;
    parentId?: string | null;
}

export interface ListFoldersParams {
    where: ListFoldersWhere;
    sort?: ListSort;
    limit?: number;
    after?: string | null;
}

export interface ListAllFoldersParams {
    where: ListFoldersWhere;
    sort?: ListSort;
}

export type CreateFolderParams = Pick<Folder, "title" | "slug" | "type" | "parentId">;

export interface UpdateFolderParams {
    title?: string;
    slug?: string;
    permissions?: any;
    parentId?: string;
}

export interface DeleteFolderParams {
    id: string;
}

export interface StorageOperationsGetFolderParams {
    id?: string;
    slug?: string;
    type?: string;
    parentId?: string | null;
}

export type StorageOperationsListFoldersParams = ListFoldersParams;

export interface StorageOperationsCreateFolderParams {
    data: CreateFolderParams;
}

export interface StorageOperationsUpdateFolderParams {
    id: string;
    data: UpdateFolderParams;
}

export type StorageOperationsDeleteFolderParams = DeleteFolderParams;

export interface OnFolderBeforeCreateTopicParams {
    input: CreateFolderParams;
}

export interface OnFolderAfterCreateTopicParams {
    folder: Folder;
}

export interface OnFolderBeforeUpdateTopicParams {
    original: Folder;
    input: Record<string, any>;
}

export interface OnFolderAfterUpdateTopicParams {
    original: Folder;
    folder: Folder;
    input: Record<string, any>;
}

export interface OnFolderBeforeDeleteTopicParams {
    folder: Folder;
}

export interface OnFolderAfterDeleteTopicParams {
    folder: Folder;
}

export type FolderAccessLevel = "owner" | "viewer" | "editor";

export interface FolderPermission {
    target: string;
    level: FolderAccessLevel;
    inheritedFrom?: string;
}

export interface FolderPermissions {
    folderId: string;
    permissions: FolderPermission[];
}

export interface CanAccessFolderParams {
    folder: Folder;
    rwd?: "r" | "w" | "d";
    foldersPermissions?: FolderPermissions[];

    // If `foldersPermissions` is not provided, we must provide the following three params.
    folders?: Folder[];
    identity?: SecurityIdentity;
    permissions?: SecurityPermission[];
}

export interface AcoFolderCrud {
    canAccessFolder(params: CanAccessFolderParams): Promise<boolean>;

    get(id: string): Promise<Folder>;

    list(params: ListFoldersParams): Promise<[Folder[], ListMeta]>;

    create(data: CreateFolderParams): Promise<Folder>;

    update(id: string, data: UpdateFolderParams): Promise<Folder>;

    delete(id: string): Promise<Boolean>;

    getFolderWithAncestors(id: string): Promise<Folder[]>;

    onFolderBeforeCreate: Topic<OnFolderBeforeCreateTopicParams>;
    onFolderAfterCreate: Topic<OnFolderAfterCreateTopicParams>;
    onFolderBeforeUpdate: Topic<OnFolderBeforeUpdateTopicParams>;
    onFolderAfterUpdate: Topic<OnFolderAfterUpdateTopicParams>;
    onFolderBeforeDelete: Topic<OnFolderBeforeDeleteTopicParams>;
    onFolderAfterDelete: Topic<OnFolderAfterDeleteTopicParams>;
}

export interface AcoFolderStorageOperations {
    getFolder(params: StorageOperationsGetFolderParams): Promise<Folder>;

    listFolders(params: StorageOperationsListFoldersParams): Promise<[Folder[], ListMeta]>;

    createFolder(params: StorageOperationsCreateFolderParams): Promise<Folder>;

    updateFolder(params: StorageOperationsUpdateFolderParams): Promise<Folder>;

    deleteFolder(params: StorageOperationsDeleteFolderParams): Promise<boolean>;
}
