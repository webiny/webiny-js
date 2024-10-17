import {
    IDataSynchronizationInput,
    IDataSynchronizationManager,
    IElasticsearchSyncParams,
    ISynchronization
} from "../types";
import { IIndexManager } from "~/settings/types";
import { NonEmptyArray } from "@webiny/api/types";
import {
    ElasticsearchSearchResponse,
    ElasticsearchSearchResponseBody,
    PrimitiveValue
} from "@webiny/api-elasticsearch/types";
import { shouldIgnoreEsResponseError } from "./shouldIgnoreEsResponseError";
import { ITaskResponseResult } from "@webiny/tasks";

import { inspect } from "node:util";
import { batchReadAll } from "@webiny/db-dynamodb";

interface IFetchParams {
    index: string;
    cursor?: PrimitiveValue[];
    limit?: number;
}

interface IFetchResponseItem {
    PK: string;
    SK: string;
}

interface IFetchResponse {
    done: boolean;
    totalCount: number;
    cursor?: PrimitiveValue[];
    items: IFetchResponseItem[];
}

interface ISynchronizeParams {
    done: boolean;
    index: string;
    totalCount: number;
    items: IFetchResponseItem[];
    cursor?: PrimitiveValue[];
}

export interface ISynchronizeResponse {
    done: boolean;
    totalCount: number;
    cursor?: PrimitiveValue[];
}

interface ISearchResultHitsItemSource {
    _id: string;
    id: string;
}

interface IDeleteFromElasticsearchOperation {
    delete: {
        _id: string;
        _index: string;
    };
}

export class ElasticsearchToDynamoDbSynchronization implements ISynchronization {
    private readonly manager: IDataSynchronizationManager;
    private readonly indexManager: IIndexManager;

    public constructor(params: IElasticsearchSyncParams) {
        this.manager = params.manager;
        this.indexManager = params.indexManager;
    }

    public async run(input: IDataSynchronizationInput): Promise<ITaskResponseResult> {
        const lastIndex = input.elasticsearchToDynamoDb?.index;
        let cursor = input.elasticsearchToDynamoDb?.cursor;
        const indexes = await this.fetchAllIndexes();
        const next = lastIndex ? indexes.findIndex(index => index === lastIndex) + 1 : 0;

        let currentIndex = indexes[next];

        while (currentIndex) {
            if (this.manager.isAborted()) {
                return this.manager.response.aborted();
            } else if (this.manager.isCloseToTimeout()) {
                return this.manager.response.continue({
                    ...input,
                    elasticsearchToDynamoDb: {
                        ...input.elasticsearchToDynamoDb,
                        index: currentIndex,
                        cursor
                    }
                });
            }

            const { done, cursor: newCursor } = await this.fetch({
                index: currentIndex,
                cursor
            });

            if (!done) {
                cursor = newCursor;
                continue;
            }
            cursor = undefined;

            const next = indexes.findIndex(index => index === currentIndex) + 1;
            currentIndex = indexes[next];
        }

        if (currentIndex) {
            try {
                const result = await this.fetch({
                    index: currentIndex,
                    cursor
                });
                const { done, cursor: newCursor } = await this.synchronize({
                    done: result.done,
                    index: currentIndex,
                    totalCount: result.totalCount,
                    items: result.items
                });
                return this.manager.response.continue({
                    ...input,
                    elasticsearchToDynamoDb: {
                        ...input.elasticsearchToDynamoDb,
                        index: currentIndex,
                        cursor: done ? undefined : newCursor
                    }
                });
            } catch (ex) {
                return this.manager.response.error(ex);
            }
        }

        return this.manager.response.continue({
            ...input,
            elasticsearchToDynamoDb: {
                ...input.elasticsearchToDynamoDb,
                finished: true
            }
        });
    }

    private async fetchAllIndexes(): Promise<NonEmptyArray<string>> {
        const result = await this.indexManager.list();
        if (result.length > 0) {
            return result as NonEmptyArray<string>;
        }
        throw new Error("No indexes found.");
    }

    private async fetch({ index, cursor, limit = 1000 }: IFetchParams): Promise<IFetchResponse> {
        let response: ElasticsearchSearchResponse<ISearchResultHitsItemSource>;
        try {
            response = await this.manager.elasticsearch.search<
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
        /**
         *
         */
        const { hits, total } = response.body.hits;
        if (hits.length > limit) {
            hits.pop();
        }
        const nextCursor = hits.pop()?.sort;
        const items = hits
            .map(hit => {
                const [PK, SK] = hit._source._id.split(":");
                if (PK && SK) {
                    return null;
                }
                return {
                    PK,
                    SK
                };
            })
            .filter((item): item is IFetchResponseItem => {
                return !!item;
            });

        return {
            totalCount: total.value,
            cursor: nextCursor,
            done: !nextCursor,
            items
        };
    }

    private async synchronize(params: ISynchronizeParams): Promise<ISynchronizeResponse> {
        const { items, cursor, done, totalCount, index } = params;
        if (items.length === 0 || totalCount === 0) {
            return {
                done: true,
                cursor: undefined,
                totalCount
            };
        }

        const dynamoDbItems = await batchReadAll({
            items: items.map(item => {
                return this.table.batchRead(item);
            }),
            table: {} as any
        });

        const missingInDynamoDb = items.filter(item => {
            return !dynamoDbItems.some(ddbItem => {
                return ddbItem.PK === item.PK && ddbItem.SK === item.SK;
            });
        });

        const deleteFromElasticsearch = missingInDynamoDb.reduce<
            IDeleteFromElasticsearchOperation[]
        >((operations, item) => {
            operations.push({
                delete: {
                    _id: `${item.PK}:${item.SK}`,
                    _index: index
                }
            });

            return operations;
        }, []);
    }
}
