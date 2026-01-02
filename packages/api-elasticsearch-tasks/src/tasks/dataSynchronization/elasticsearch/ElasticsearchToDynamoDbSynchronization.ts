import type {
    IDataSynchronizationInput,
    IDataSynchronizationManager,
    IElasticsearchSyncParams,
    ISynchronization,
    ISynchronizationRunResult
} from "../types.js";
import type { IIndexManager } from "~/settings/types.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IElasticsearchSynchronize } from "./abstractions/ElasticsearchSynchronize.js";
import type { IElasticsearchFetcher } from "./abstractions/ElasticsearchFetcher.js";

export class ElasticsearchToDynamoDbSynchronization implements ISynchronization {
    private readonly manager: IDataSynchronizationManager;
    private readonly indexManager: IIndexManager;
    private readonly synchronize: IElasticsearchSynchronize;
    private readonly fetcher: IElasticsearchFetcher;

    public constructor(params: IElasticsearchSyncParams) {
        this.manager = params.manager;
        this.indexManager = params.indexManager;
        this.synchronize = params.synchronize;
        this.fetcher = params.fetcher;
    }

    public async run(input: IDataSynchronizationInput): Promise<ISynchronizationRunResult> {
        const lastIndex = input.elasticsearchToDynamoDb?.index;
        let cursor = input.elasticsearchToDynamoDb?.cursor;
        const indexes = await this.fetchAllIndexes();

        let next = 0;
        if (lastIndex) {
            next = indexes.findIndex(index => index === lastIndex);
        }

        let currentIndex = indexes[next];

        while (currentIndex) {
            if (this.manager.controller.runtime.isAborted()) {
                return this.manager.controller.response.aborted();
            }
            /**
             * We will put 180 seconds because we are writing to the Elasticsearch/OpenSearch directly.
             * We want to leave enough time for possible retries.
             */
            //
            else if (this.manager.controller.runtime.isCloseToTimeout(180)) {
                return this.manager.controller.response.continue({
                    ...input,
                    elasticsearchToDynamoDb: {
                        ...input.elasticsearchToDynamoDb,
                        index: currentIndex,
                        cursor
                    }
                });
            }

            const result = await this.fetcher.fetch({
                index: currentIndex,
                cursor,
                limit: 100
            });

            const syncResult = await this.synchronize.execute({
                done: result.done,
                index: currentIndex,
                items: result.items
            });

            if (!syncResult.done && result.cursor) {
                cursor = result.cursor;
                continue;
            }
            cursor = undefined;

            const next = indexes.findIndex(index => index === currentIndex) + 1;
            currentIndex = indexes[next];
        }

        return this.manager.controller.response.continue({
            ...input,
            elasticsearchToDynamoDb: {
                finished: true
            }
        });
    }

    private async fetchAllIndexes(): Promise<NonEmptyArray<string>> {
        const result = await this.indexManager.list();
        if (result.length > 0) {
            return result as NonEmptyArray<string>;
        }
        throw new Error("No Elasticsearch / OpenSearch indexes found.");
    }
}
