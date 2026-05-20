import type { Client } from "@webiny/api-opensearch";
import type {
    IElasticsearchFetcher,
    IElasticsearchFetcherFetchParams,
    IElasticsearchFetcherFetchResponse,
    IElasticsearchFetcherFetchResponseItem
} from "./abstractions/ElasticsearchFetcher.js";
import {
    type OpenSearchSearchResponse,
    type PrimitiveValue,
    getTotalCount
} from "@webiny/api-opensearch/types.js";
import { shouldIgnoreEsResponseError } from "./shouldIgnoreEsResponseError.js";
import { inspect } from "node:util";

export interface IElasticsearchFetcherParams {
    client: Client;
}

export class ElasticsearchFetcher implements IElasticsearchFetcher {
    private readonly client: Client;

    public constructor(params: IElasticsearchFetcherParams) {
        this.client = params.client;
    }
    public async fetch({
        index,
        cursor,
        limit
    }: IElasticsearchFetcherFetchParams): Promise<IElasticsearchFetcherFetchResponse> {
        let response: OpenSearchSearchResponse;
        try {
            response = await this.client.search({
                index,
                body: {
                    query: {
                        match_all: {}
                    },
                    sort: {
                        "id.keyword": {
                            order: "asc"
                        }
                    },
                    size: limit + 1,
                    track_total_hits: true,
                    search_after: cursor,
                    _source: false
                }
            });
        } catch (ex) {
            /**
             * If we ignore the error, we can continue with the next index.
             */
            if (shouldIgnoreEsResponseError(ex)) {
                if (process.env.DEBUG === "true") {
                    console.error(
                        inspect(ex, {
                            depth: 5,
                            showHidden: true
                        })
                    );
                }
                return {
                    done: true,
                    totalCount: 0,
                    items: []
                };
            }
            console.error("Failed to fetch data from Elasticsearch.", ex);
            throw ex;
        }

        const { hits, total } = response.body.hits;
        if (hits.length === 0) {
            return {
                done: true,
                cursor: undefined,
                totalCount: getTotalCount(total),
                items: []
            };
        }

        /**
         * TODO expect errors over hit properties is required due to opensearch library narrowing types too much because of the _source: false. At least what Claude says, didnt go into it too much.
         * Properties are there, but types are not correct.
         */
        const hasMoreItems = hits.length > limit;
        let nextCursor: PrimitiveValue[] | undefined;
        if (hasMoreItems) {
            hits.pop();
            // @ts-expect-error
            nextCursor = hits.at(-1)?.sort;
        }
        const items = hits.reduce<IElasticsearchFetcherFetchResponseItem[]>((collection, hit) => {
            // @ts-expect-error
            const [PK, SK] = hit._id.split(":");
            if (!PK || !SK) {
                return collection;
            }
            collection.push({
                PK,
                SK,
                // @ts-expect-error
                _id: hit._id,
                // @ts-expect-error
                index: hit._index
            });

            return collection;
        }, []);

        return {
            totalCount: getTotalCount(total),
            cursor: nextCursor,
            done: !nextCursor,
            items
        };
    }
}
