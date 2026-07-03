import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import {
    ElasticsearchFetcher as Abstraction,
    type IElasticsearchFetcherFetchResponseItem
} from "./abstractions/ElasticsearchFetcher.js";
import {
    type OpenSearchSearchResponse,
    type PrimitiveValue,
    getTotalCount
} from "@webiny/api-opensearch/types.js";
import { shouldIgnoreEsResponseError } from "./shouldIgnoreEsResponseError.js";
import { inspect } from "node:util";

class ElasticsearchFetcherImpl implements Abstraction.Interface {
    private readonly client: OpenSearchClient.Client;

    constructor(openSearchClient: OpenSearchClient.Interface) {
        this.client = openSearchClient.use();
    }

    public async fetch({
        index,
        cursor,
        limit
    }: Abstraction.FetchParams): Promise<Abstraction.FetchResponse> {
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

export const ElasticsearchFetcher = Abstraction.createImplementation({
    implementation: ElasticsearchFetcherImpl,
    dependencies: [OpenSearchClient]
});
