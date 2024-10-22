import { PrimitiveValue } from "@webiny/api-elasticsearch/types";

export interface IElasticsearchFetcherFetchResponseItem {
    PK: string;
    SK: string;
}

export interface IElasticsearchFetcherFetchParams {
    index: string;
    cursor?: PrimitiveValue[];
    limit: number;
}

export interface IElasticsearchFetcherFetchResponse {
    done: boolean;
    totalCount: number;
    cursor?: PrimitiveValue[];
    items: IElasticsearchFetcherFetchResponseItem[];
}

export interface IElasticsearchFetcher {
    fetch(params: IElasticsearchFetcherFetchParams): Promise<IElasticsearchFetcherFetchResponse>;
}
