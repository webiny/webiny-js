import type { ListMeta, ListSort, User } from "~/types";
import { type FolderPermission } from "~/types";
import type { Topic } from "@webiny/pubsub/types";

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
    path: string;
    extensions?: Record<string, any>;
}

export interface ListFoldersWhere {
    type: string;
    id_not_in?: string[];
    parentId?: string | null;
    parentId_in?: string[];
    slug?: string;
    slug_not?: string;
    slug_contains?: string;
    slug_not_contains?: string;
    slug_in?: string[];
    slug_not_in?: string[];
    slug_startsWith?: string;
    slug_not_startsWith?: string;
    path?: string;
    path_not?: string;
    path_contains?: string;
    path_not_contains?: string;
    path_in?: string[];
    path_not_in?: string[];
    path_startsWith?: string;
    path_not_startsWith?: string;
}

export interface ListFoldersParams {
    where: ListFoldersWhere;
    sort?: ListSort;
    limit?: number;
    after?: string | null;
    disablePermissions?: boolean;
}

export type ListAllFoldersParams = Omit<ListFoldersParams, "limit" | "after">;

export interface GetFolderHierarchyParams {
    type: string;
    id: string;
}

export interface GetFolderHierarchyResponse {
    parents: Folder[];
    siblings: Folder[];
}

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

export interface GetFolderParams {
    id: string;
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
    get(id: string, disablePermissions?: boolean): Promise<Folder>;

    list(params: ListFoldersParams): Promise<[Folder[], ListMeta]>;

    listFolderLevelPermissionsTargets(): Promise<
        [FolderLevelPermissionsTarget[], FolderLevelPermissionsTargetListMeta]
    >;

    listAll(params: ListAllFoldersParams): Promise<[Folder[], ListMeta]>;

    create(data: CreateFolderParams): Promise<Folder>;

    update(id: string, data: UpdateFolderParams): Promise<Folder>;

    delete(id: string): Promise<boolean>;

    getAncestors(folder: Folder): Promise<Folder[]>;

    getFolderHierarchy(params: GetFolderHierarchyParams): Promise<GetFolderHierarchyResponse>;

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
