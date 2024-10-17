export interface TrashBinListQueryVariables {
    where?: {
        [key: string]: any;
    };
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
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

export interface TrashBinLocation {
    folderId: string;
}

export enum LoadingActions {
    list = "LIST",
    listMore = "LIST_MORE",
    delete = "DELETE",
    restore = "RESTORE"
}

export interface TrashBinBulkActionsParams {
    where?: {
        [key: string]: any;
    };
    search?: string;
    data?: {
        [key: string]: any;
    };
}

export interface TrashBinBulkActionsGatewayParams extends TrashBinBulkActionsParams {
    action: string;
}

export interface TrashBinBulkActionsResponse {
    id: string;
}
