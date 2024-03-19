export interface TrashBinListQueryVariables {
    where?: {
        [key: string]: any;
    };
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface TrashBinMetaResponse {
    totalCount: number;
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface TrashBinIdentity {
    id: string;
    displayName: string;
    type: string;
}

export type Loading<T extends LoadingEnum> = { [K in T]?: boolean };

export enum LoadingEnum {
    init = "INIT",
    list = "LIST",
    listMore = "LIST_MORE",
    delete = "DELETE",
    restore = "RESTORE"
}
