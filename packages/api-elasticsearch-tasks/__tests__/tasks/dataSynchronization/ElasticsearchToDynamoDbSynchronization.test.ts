import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/helpers/useHandler";
import { createDataSynchronization, DATA_SYNCHRONIZATION_TASK } from "~/tasks";
import type { Context } from "@webiny/api-dynamodb-to-elasticsearch";
import { SynchronizationBuilder } from "@webiny/api-dynamodb-to-elasticsearch";
import type { ITimer } from "@webiny/handler-aws";
import type { IIndexManager } from "~/settings/types";
import { IndexManager } from "~/settings";
import { timerFactory } from "@webiny/handler-aws/utils";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition";

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
    context: Pick<Context, "opensearch">;
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
        index => index.includes("wbytask") && index.includes("-headless-cms-")
    );
    if (!index) {
        throw new Error("No index found.");
    }
    return index;
};

describe("ElasticsearchToDynamoDbSynchronization", () => {
    it("should run a sync without any indexes and throw an error", async () => {
        const handler = useHandler({
            plugins: [createDataSynchronization()]
        });

        const context = await handler.rawHandle();

        // Create task
        const task = await context.tasks.createTask({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                flow: "elasticsearchToDynamoDb"
            },
            name: "Test Sync No Indexes"
        });

        // Get task definition from container
        const taskDefinitions = context.container.resolveAll(TaskDefinition);
        const taskDefinition = taskDefinitions.find(td => td.id === DATA_SYNCHRONIZATION_TASK)!;

        // Create runner
        const runner = createRunner({
            context,
            task: taskDefinition,
            onContinue: async () => {}
        });

        // Run the task - it should succeed even without indexes (task creation creates required indexes)
        const result = await runner({ webinyTaskId: task.id });

        // Verify it completed successfully
        expect(result.status).toBe("done");
        expect(result.webinyTaskId).toBe(task.id);
    });

    it("should run a sync with indexes and finish", async () => {
        const handler = useHandler({
            plugins: [createDataSynchronization()]
        });

        const context = await handler.rawHandle();

        // Create task first
        const task = await context.tasks.createTask({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                flow: "elasticsearchToDynamoDb"
            },
            name: "Test Sync With Indexes"
        });

        // Get task index from context
        const indexManager = new IndexManager(context.opensearch, {});
        const index = await getTaskIndex(indexManager);

        // Insert mock data into Elasticsearch
        const totalMockItemsToInsert = 101;
        const recordsFactory = createRecordsFactory({
            context,
            index,
            timer: timerFactory(),
            records: totalMockItemsToInsert
        });

        await recordsFactory.run();

        // Verify data was inserted (includes task record created during task creation)
        const response = await context.opensearch.search(queryAllRecords(index));
        expect(response.body.hits.hits).toHaveLength(totalMockItemsToInsert + 1);

        // Get task definition and create runner
        const taskDefinitions = context.container.resolveAll(TaskDefinition);
        const taskDefinition = taskDefinitions.find(td => td.id === DATA_SYNCHRONIZATION_TASK)!;

        const runner = createRunner({
            context,
            task: taskDefinition,
            onContinue: async () => {}
        });

        // Run the task
        const result = await runner({ webinyTaskId: task.id });

        // Verify result structure (new format)
        expect(result.status).toBeDefined();
        expect(result.webinyTaskId).toBe(task.id);

        // Verify data was cleaned up
        const afterRunResponse = await context.opensearch.search(queryAllRecords(index));
        expect(afterRunResponse.body.hits.hits).toHaveLength(1);
    });
});
