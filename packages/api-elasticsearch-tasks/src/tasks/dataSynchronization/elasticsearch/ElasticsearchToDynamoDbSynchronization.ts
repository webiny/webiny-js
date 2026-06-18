import type { IDataSynchronizationInput, ISynchronizationRunResult } from "../types.js";
import type { IIndexManager } from "~/settings/types.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import { Manager } from "~/types.js";
import { ElasticsearchSynchronize } from "./abstractions/ElasticsearchSynchronize.js";
import { ElasticsearchFetcher } from "./abstractions/ElasticsearchFetcher.js";
import { ElasticsearchToDynamoDbSynchronization as Abstraction } from "./abstractions/ElasticsearchToDynamoDbSynchronization.js";

class ElasticsearchToDynamoDbSynchronizationImpl implements Abstraction.Interface {
    constructor(
        private readonly manager: Manager.Interface,
        private readonly synchronize: ElasticsearchSynchronize.Interface,
        private readonly fetcher: ElasticsearchFetcher.Interface
    ) {}

    public async run(
        input: IDataSynchronizationInput,
        indexManager: IIndexManager
    ): Promise<ISynchronizationRunResult> {
        const lastIndex = input.elasticsearchToDynamoDb?.index;
        let cursor = input.elasticsearchToDynamoDb?.cursor;
        const indexes = await this.fetchAllIndexes(indexManager);

        let next = 0;
        if (lastIndex) {
            next = indexes.findIndex(index => index === lastIndex);
        }

        let currentIndex = indexes[next];

        while (currentIndex) {
            if (this.manager.controller.runtime.isAborted()) {
                return this.manager.controller.response.aborted();
            } else if (this.manager.controller.runtime.isCloseToTimeout(180)) {
                return this.manager.controller.response.continue({
                    ...input,
                    elasticsearchToDynamoDb: {
                        ...input.elasticsearchToDynamoDb,
                        index: currentIndex,
                        cursor
                    }
                }) as ISynchronizationRunResult;
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
        }) as ISynchronizationRunResult;
    }

    private async fetchAllIndexes(indexManager: IIndexManager): Promise<NonEmptyArray<string>> {
        const result = await indexManager.list();
        if (result.length > 0) {
            return result as NonEmptyArray<string>;
        }
        throw new Error("No Elasticsearch / OpenSearch indexes found.");
    }
}

export const ElasticsearchToDynamoDbSynchronization = Abstraction.createImplementation({
    implementation: ElasticsearchToDynamoDbSynchronizationImpl,
    dependencies: [Manager, ElasticsearchSynchronize, ElasticsearchFetcher]
});
