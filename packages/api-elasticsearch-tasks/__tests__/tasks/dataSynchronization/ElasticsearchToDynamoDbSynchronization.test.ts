import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/helpers/useHandler";
import { DATA_SYNCHRONIZATION_TASK } from "~/tasks";
import { Container } from "@webiny/feature/api";
import {
    SynchronizationBuilder,
    SynchronizationBuilderFeature,
    ExecuteSyncFeature,
    ExecuteSyncWithRetryFeature,
    OperationsFactoryFeature
} from "@webiny/api-sync-to-opensearch";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { ProcessEnvFeature } from "@webiny/stdlib/node";
import type { ITimer } from "@webiny/utils/features/Timer/abstraction.js";
import { timerFactory } from "@webiny/handler-aws/utils";
import { createRunner } from "@webiny/project-utils/testing/tasks/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch";

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
    opensearch: OpenSearchClient.Client;
    index: string;
}

const createRecordsFactory = (params: ICreateSyncBuilderParams) => {
    const { timer, opensearch, index, records } = params;

    const container = new Container();
    ProcessEnvFeature.register(container);
    TimerFeature.register(container, timer);
    OperationsFactoryFeature.register(container);
    ExecuteSyncFeature.register(container);
    ExecuteSyncWithRetryFeature.register(container);
    SynchronizationBuilderFeature.register(container);
    container.registerInstance(OpenSearchClient, { use: () => opensearch });

    const syncBuilder = container.resolve(SynchronizationBuilder);

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

const TEST_INDEX = "wbytask-root-headless-cms-sync-test";

describe("ElasticsearchToDynamoDbSynchronization", () => {
    it("should run a sync without any indexes and finish gracefully", async () => {
        const handler = useHandler({});

        const context = await handler.rawHandle();

        const task = await context.tasks.createTask({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                flow: "elasticsearchToDynamoDb"
            },
            name: "Test Sync No Indexes"
        });

        const taskDefinitions = context.container.resolveAll(TaskDefinition);
        const taskDefinition = taskDefinitions.find(td => td.id === DATA_SYNCHRONIZATION_TASK)!;

        const runner = createRunner({
            context,
            task: taskDefinition,
            onContinue: async () => {}
        });

        const result = await runner({ webinyTaskId: task.id });

        expect(result.status).toBe("done");
        expect(result.webinyTaskId).toBe(task.id);
    });

    // Requires DDB-ES/DDB-OS storage preset (DbRegistry populated with CMS entities).
    it.skip("should run a sync with indexes and finish", async () => {
        const handler = useHandler({});

        const context = await handler.rawHandle();

        const task = await context.tasks.createTask({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                flow: "elasticsearchToDynamoDb"
            },
            name: "Test Sync With Indexes"
        });

        const opensearchClient = context.container.resolve(OpenSearchClient);
        const client = opensearchClient.use();

        await client.indices.create({ index: TEST_INDEX });

        const totalMockItemsToInsert = 101;
        const recordsFactory = createRecordsFactory({
            opensearch: client,
            index: TEST_INDEX,
            timer: timerFactory(),
            records: totalMockItemsToInsert
        });

        await recordsFactory.run();

        const response = await client.search(queryAllRecords(TEST_INDEX));
        expect(response.body.hits.hits).toHaveLength(totalMockItemsToInsert);

        const taskDefinitions = context.container.resolveAll(TaskDefinition);
        const taskDefinition = taskDefinitions.find(td => td.id === DATA_SYNCHRONIZATION_TASK)!;

        const runner = createRunner({
            context,
            task: taskDefinition,
            onContinue: async () => {}
        });

        const result = await runner({ webinyTaskId: task.id });

        expect(result.status).toBeDefined();
        expect(result.webinyTaskId).toBe(task.id);

        const afterRunResponse = await client.search(queryAllRecords(TEST_INDEX));
        expect(afterRunResponse.body.hits.hits).toHaveLength(1);
    });
});
