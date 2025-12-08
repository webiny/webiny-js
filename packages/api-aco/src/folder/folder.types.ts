import type { ListSort, User } from "~/types.js";
import { type FolderPermission } from "~/types.js";

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
}

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

export interface GetFolderParams {
    id: string;
}
