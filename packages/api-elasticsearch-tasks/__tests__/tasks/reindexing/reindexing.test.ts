import { describe, expect, it } from "vitest";
/**
 * Tests in this file will use real data and Elasticsearch instance.
 */
import { useHandler } from "~tests/helpers/useHandler";
import { TaskDataStatus } from "@webiny/tasks/types";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition";

const createContextAndTask = async (handler: ReturnType<typeof useHandler>) => {
    const context = await handler.rawHandle();

    const task = await context.tasks.createTask({
        name: "Run reindexing to test it",
        definitionId: "elasticsearchReindexing",
        input: {
            /**
             * We do not actually want to reindex anything, so we will use a non-existing index.
             */
            matching: "non-existing-index-for-testing"
        }
    });

    const taskDefinitions = context.container.resolveAll(TaskDefinition);
    const taskDefinition = taskDefinitions.find(td => td.id === "elasticsearchReindexing")!;

    return {
        context,
        task,
        taskDefinition
    };
};

describe("reindexing", () => {
    it("should return a done response - no items at all to reindex", async () => {
        const handler = useHandler({});

        const { context, task, taskDefinition } = await createContextAndTask(handler);

        const runner = createRunner({
            context,
            task: taskDefinition,
            onContinue: async () => {}
        });

        const result = await runner({ webinyTaskId: task.id });

        expect(result.status).toBe("done");
        expect(result.webinyTaskId).toBe(task.id);

        const updatedTask = await context.tasks.getTask(task.id);

        expect(updatedTask?.taskStatus).toBe(TaskDataStatus.SUCCESS);
        expect(updatedTask?.iterations).toBe(1);
    });
});
