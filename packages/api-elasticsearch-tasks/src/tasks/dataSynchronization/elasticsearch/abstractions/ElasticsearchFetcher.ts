import { createAbstraction } from "@webiny/feature/api";
import type { PrimitiveValue } from "@webiny/api-opensearch/types.js";

export interface IElasticsearchFetcherFetchResponseItem {
    PK: string;
    SK: string;
    _id: string;
    index: string;
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

export const ElasticsearchFetcher = createAbstraction<IElasticsearchFetcher>(
    "ElasticsearchTasks/ElasticsearchFetcher"
);

export namespace ElasticsearchFetcher {
    export type Interface = IElasticsearchFetcher;
    export type FetchParams = IElasticsearchFetcherFetchParams;
    export type FetchResponse = IElasticsearchFetcherFetchResponse;
    export type FetchResponseItem = IElasticsearchFetcherFetchResponseItem;
}
