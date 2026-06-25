export type * from "@webiny/shared-aco/flp/flp.types.js";
export type * from "~/table.types.js";

export interface CmsIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface FolderLevelPermissionsTarget<TMeta = Record<string, any>> {
    id: string;
    target: string;
    name: string;
    type: string;
    meta: TMeta;
}

export type GenericSearchData = {
    [key: string]: any;
};

export interface Location {
    folderId: string;
}

export interface TagItem {
    tag: string;
}

export type Loading<T extends string> = { [P in T]?: boolean };

export type LoadingActions =
    | "INIT"
    | "LIST"
    | "LIST_MORE"
    | "GET"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "MOVE";

export const LoadingActionsEnum = {
    init: "INIT",
    list: "LIST",
    listMore: "LIST_MORE",
    get: "GET",
    create: "CREATE",
    update: "UPDATE",
    delete: "DELETE",
    move: "MOVE"
};

export interface AcoError {
    code: string;
    message: string;
    data?: Record<string, any> | null;
}

export interface ListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}
