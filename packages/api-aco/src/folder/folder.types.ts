import { ListMeta, ListSort, User } from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { FolderPermission } from "~/utils/FolderLevelPermissions";

export interface Folder {
    id: string;
    entryId: string;
    createdOn: string;
    modifiedOn: string | null;
    savedOn: string;
    createdBy: User;
    modifiedBy: User | null;
    savedBy: User;
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

export type ListAllFoldersParams = Omit<ListFoldersParams, "limit" | "after">;

export type CreateFolderParams = Pick<Folder, "title" | "slug" | "type" | "parentId">;

export interface UpdateFolderParams {
    title?: string;
    slug?: string;
    permissions?: FolderPermission[];
    parentId?: string;
}

export interface DeleteFolderParams {
    id: string;
}

export interface FolderLevelPermissionsTarget<TMeta = Record<string, any>> {
    id: string;
    target: string;
    name: string;
    type: string;
    meta: TMeta;
}

export interface FolderLevelPermissionsTargetListMeta {
    totalCount: number;
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

export interface AcoFolderCrud {
    get(id: string): Promise<Folder>;

    list(params: ListFoldersParams): Promise<[Folder[], ListMeta]>;

    listFolderLevelPermissionsTargets(): Promise<
        [FolderLevelPermissionsTarget[], FolderLevelPermissionsTargetListMeta]
    >;

    listAll(params: ListAllFoldersParams): Promise<[Folder[], ListMeta]>;

    create(data: CreateFolderParams): Promise<Folder>;

    update(id: string, data: UpdateFolderParams): Promise<Folder>;

    delete(id: string): Promise<boolean>;

    getAncestors(folder: Folder): Promise<Folder[]>;

    /**
     * @deprecated use `getAncestors` instead
     */
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
