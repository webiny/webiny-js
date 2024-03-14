export interface BinListQueryVariables {
    where?: {
        [key: string]: any;
    };
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface BinMetaResponse {
    totalCount: number;
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface BinIdentity {
    id: string;
    displayName: string;
    type: string;
}
