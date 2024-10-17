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

interface ISynchronizeParams {
    index: string;
    cursor?: PrimitiveValue[];
    limit?: number;
}

interface ISynchronizeResponse {
    done: boolean;
    totalCount: number;
    cursor?: PrimitiveValue[];
}

interface ISearchResultHitsItemSource {
    _id: string;
    id: string;
}

export class ElasticsearchSynchronization implements ISynchronization {
    private readonly manager: IDataSynchronizationManager;
    private readonly indexManager: IIndexManager;

    public constructor(params: IElasticsearchSyncParams) {
        this.manager = params.manager;
        this.indexManager = params.indexManager;
    }

    public async run(input: IDataSynchronizationInput): Promise<ITaskResponseResult> {
        const lastIndex = input.elasticsearch?.index;
        let cursor = input.elasticsearch?.cursor;
        const indexes = await this.fetchAllIndexes();
        const next = lastIndex ? indexes.findIndex(index => index === lastIndex) + 1 : 0;

        let currentIndex = indexes[next];

        while (currentIndex) {
            if (this.manager.isAborted()) {
                return this.manager.response.aborted();
            } else if (this.manager.isCloseToTimeout()) {
                return this.manager.response.continue({
                    ...input,
                    elasticsearch: {
                        ...input.elasticsearch,
                        index: currentIndex,
                        cursor
                    }
                });
            }

            const { done, cursor: newCursor } = await this.synchronize({
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
                const { done, cursor: newCursor } = await this.synchronize({
                    index: currentIndex,
                    cursor
                });
                return this.manager.response.continue({
                    ...input,
                    elasticsearch: {
                        ...input.elasticsearch,
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
            elasticsearch: {
                ...input.elasticsearch,
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

    private async synchronize({
        index,
        cursor,
        limit = 1000
    }: ISynchronizeParams): Promise<ISynchronizeResponse> {
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
                return {
                    done: true,
                    totalCount: 0
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
        if (!nextCursor) {
            return {
                totalCount: total.value,
                done: true
            };
        }
        return {
            totalCount: total.value,
            cursor: nextCursor,
            done: false
        };
    }
}
