import { describe, expect, it } from "vitest";
import { ElasticsearchToDynamoDbSynchronization } from "~/tasks/dataSynchronization/elasticsearch/ElasticsearchToDynamoDbSynchronization";
import { useHandler } from "~tests/helpers/useHandler";
import { createManagers } from "./managers";
import { ElasticsearchFetcher } from "~/tasks/dataSynchronization/elasticsearch/ElasticsearchFetcher";
import { ElasticsearchSynchronize } from "~/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize";
import { DATA_SYNCHRONIZATION_TASK } from "~/tasks";
import type { Context } from "@webiny/api-dynamodb-to-elasticsearch";
import { SynchronizationBuilder } from "@webiny/api-dynamodb-to-elasticsearch";
import type { ITimer } from "@webiny/handler-aws";
import type { IIndexManager } from "~/settings/types";

const queryAllRecords = (index: string) => {
    return {
        index,
        body: {
            query: {
                match_all: {}
            },
            size: 10000,
            _source: false
        }
    };
};

interface ICreateSyncBuilderParams {
    records: number;
    timer: ITimer;
    context: Pick<Context, "elasticsearch" | "logger">;
    index: string;
}

const createRecordsFactory = (params: ICreateSyncBuilderParams) => {
    const { timer, context, index, records } = params;
    const syncBuilder = new SynchronizationBuilder({
        timer,
        context
    });

    for (let i = 0; i < records; i++) {
        syncBuilder.insert({
            id: `pkValue${i}:skValue${i}`,
            index,
            data: {
                id: `skValue${i}`,
                aText: `myText - ${i}`
            }
        });
    }
    return {
        run: () => {
            return syncBuilder.build()();
        }
    };
};

const getTaskIndex = async (manager: IIndexManager): Promise<string> => {
    const indexes = await manager.list();
    const index = indexes.find(
        index => index.includes("webinytask") && index.includes("-headless-cms-")
    );
    if (!index) {
        throw new Error("No index found.");
    }
    return index;
};

describe("ElasticsearchToDynamoDbSynchronization", () => {
    it("should run a sync without any indexes and throw an error", async () => {
        expect.assertions(1);
        const handler = useHandler();

        const context = await handler.rawHandle();

        const { manager, indexManager } = createManagers({
            context
        });

        const sync = new ElasticsearchToDynamoDbSynchronization({
            manager,
            indexManager,
            fetcher: new ElasticsearchFetcher({
                client: context.elasticsearch
            }),
            synchronize: new ElasticsearchSynchronize({
                context,
                timer: manager.timer
            })
        });

        try {
            const result = await sync.run({
                flow: "elasticsearchToDynamoDb"
            });
            const a = result;
        } catch (ex) {
            expect(ex.message).toBe("No Elasticsearch / OpenSearch indexes found.");
        }
    });

    it("should run a sync with indexes and finish", async () => {
        const handler = useHandler();

        const context = await handler.rawHandle();

        await context.tasks.createTask({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                flow: "elasticsearchToDynamoDb"
            },
            name: "Data Sync Mock Task"
        });

        const { manager, indexManager } = createManagers({
            context
        });

        const index = await getTaskIndex(indexManager);

        const totalMockItemsToInsert = 101;
        const recordsFactory = createRecordsFactory({
            context,
            index,
            timer: manager.timer,
            records: totalMockItemsToInsert
        });
        try {
            await recordsFactory.run();
        } catch (ex) {
            expect(ex.message).toBe("Should not reach this point.");
        }
        /**
         * Now we need to make sure that the mock data is in the index.
         */
        const response = await context.elasticsearch.search(queryAllRecords(index));
        expect(response.body.hits.hits).toHaveLength(totalMockItemsToInsert + 1);

        const sync = new ElasticsearchToDynamoDbSynchronization({
            manager,
            indexManager,
            fetcher: new ElasticsearchFetcher({
                client: context.elasticsearch
            }),
            synchronize: new ElasticsearchSynchronize({
                context,
                timer: manager.timer
            })
        });

        const result = await sync.run({
            flow: "elasticsearchToDynamoDb"
        });
        expect(result).toEqual({
            delay: -1,
            input: {
                elasticsearchToDynamoDb: {
                    finished: true
                },
                flow: "elasticsearchToDynamoDb"
            },
            message: undefined,
            status: "continue",
            tenant: "root",
            wait: undefined,
            webinyTaskDefinitionId: "mockDefinitionId",
            webinyTaskId: "mockEventId"
        });
        /**
         * Now we need to make sure that the mock data is not in the index anymore.
         */
        const afterRunResponse = await context.elasticsearch.search(queryAllRecords(index));
        expect(afterRunResponse.body.hits.hits).toHaveLength(1);
    });
});
