import { Client } from "@webiny/api-elasticsearch";
import {
    IElasticsearchFetcher,
    IElasticsearchFetcherFetchParams,
    IElasticsearchFetcherFetchResponse,
    IElasticsearchFetcherFetchResponseItem
} from "./abstractions/ElasticsearchFetcher";
import {
    ElasticsearchSearchResponse,
    ElasticsearchSearchResponseBody
} from "@webiny/api-elasticsearch/types";
import { shouldIgnoreEsResponseError } from "./shouldIgnoreEsResponseError";
import { inspect } from "node:util";

export interface IElasticsearchFetcherParams {
    client: Client;
}

interface ISearchResultHitsItemSource {
    _id: string;
    id: string;
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
        let response: ElasticsearchSearchResponse<ISearchResultHitsItemSource>;
        try {
            response = await this.client.search<
                ElasticsearchSearchResponseBody<ISearchResultHitsItemSource>
            >({
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
                    search_after: cursor
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
        if (hits.length > limit) {
            hits.pop();
        }
        const nextCursor = hits.pop()?.sort;
        const items = hits.reduce<IElasticsearchFetcherFetchResponseItem[]>((collection, hit) => {
            const [PK, SK] = hit._source._id.split(":");
            if (!PK || !SK) {
                return collection;
            }
            collection.push({
                PK,
                SK
            });

            return collection;
        }, []);

        return {
            totalCount: total.value,
            cursor: nextCursor,
            done: !nextCursor,
            items
        };
    }
}
