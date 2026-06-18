import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/helpers/useHandler";
import { DATA_SYNCHRONIZATION_TASK } from "~/tasks";
import type { Context } from "@webiny/api-dynamodb-to-elasticsearch";
import { SynchronizationBuilder } from "@webiny/api-dynamodb-to-elasticsearch";
import type { ITimer } from "@webiny/handler-aws";
import type { IIndexManager } from "~/settings/types";
import { IndexManager } from "~/settings";
import { timerFactory } from "@webiny/handler-aws/utils";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition";
import type { DisableIndexing } from "~/settings/abstractions/DisableIndexing";
import type { EnableIndexing } from "~/settings/abstractions/EnableIndexing";

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

const noopDisableIndexing: DisableIndexing.Interface = {
    exec: async () => ({ numberOfReplicas: 1, refreshInterval: "1s" })
};

const noopEnableIndexing: EnableIndexing.Interface = {
    exec: async () => {}
};

describe("ElasticsearchToDynamoDbSynchronization", () => {
    it("should run a sync without any indexes and throw an error", async () => {
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

    it("should run a sync with indexes and finish", async () => {
        const handler = useHandler({});

        const context = await handler.rawHandle();

        const task = await context.tasks.createTask({
            definitionId: DATA_SYNCHRONIZATION_TASK,
            input: {
                flow: "elasticsearchToDynamoDb"
            },
            name: "Test Sync With Indexes"
        });

        const indexManager = new IndexManager(
            context.opensearch,
            noopDisableIndexing,
            noopEnableIndexing,
            {}
        );
        const index = await getTaskIndex(indexManager);

        const totalMockItemsToInsert = 101;
        const recordsFactory = createRecordsFactory({
            context,
            index,
            timer: timerFactory(),
            records: totalMockItemsToInsert
        });

        await recordsFactory.run();

        const response = await context.opensearch.search(queryAllRecords(index));
        expect(response.body.hits.hits).toHaveLength(totalMockItemsToInsert + 1);

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

        const afterRunResponse = await context.opensearch.search(queryAllRecords(index));
        expect(afterRunResponse.body.hits.hits).toHaveLength(1);
    });
});
