/**
 * Tests in this file will use real data and Elasticsearch instance.
 */
import { useHandler } from "~tests/helpers/useHandler";
import { ResponseContinueResult, ResponseDoneResult } from "@webiny/tasks/response";
import { ITaskEvent } from "@webiny/tasks/handler/types";
import { TaskDataStatus } from "@webiny/tasks/types";

const createContextTaskAndEvent = async (handler: ReturnType<typeof useHandler>) => {
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

    const event: ITaskEvent = {
        webinyTaskId: task.id,
        webinyTaskDefinitionId: task.definitionId,
        executionName: "someExecutionName",
        tenant: "root",
        locale: "en-US",
        stateMachineId: "someStateMachineId",
        endpoint: "manage"
    };

    return {
        context,
        task,
        event
    };
};

describe("reindexing", () => {
    it("should return a done response - no items at all to reindex", async () => {
        const handler = useHandler({});

        const { context, task, event } = await createContextTaskAndEvent(handler);

        const result = await handler.handle(event);
        expect(result).toBeInstanceOf(ResponseDoneResult);
        expect(result).toEqual(
            new ResponseDoneResult({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: task.definitionId,
                tenant: "root",
                locale: "en-US",
                message: "No more items to process - no last evaluated keys."
            })
        );

        const updatedTask = await context.tasks.getTask(task.id);

        expect(updatedTask).toEqual({
            ...task,
            input: {
                ...task.input,
                settings: {}
            },
            executionName: "someExecutionName",
            savedOn: expect.toBeDateString(),
            startedOn: expect.toBeDateString(),
            finishedOn: expect.toBeDateString(),
            taskStatus: TaskDataStatus.SUCCESS,
            iterations: 1
        });
    });

    it("should return a continue response - mock lambda timeout", async () => {
        const handler = useHandler({});

        const { context, task, event } = await createContextTaskAndEvent(handler);

        const result = await handler.handle(event, {
            getRemainingTimeInMillis: () => 100
        });

        expect(result).toEqual(
            new ResponseContinueResult({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: task.definitionId,
                tenant: "root",
                locale: "en-US",
                input: {}
            })
        );

        const updatedTask = await context.tasks.getTask(task.id);

        expect(updatedTask).toEqual({
            ...task,
            executionName: "someExecutionName",
            savedOn: expect.toBeDateString(),
            startedOn: expect.toBeDateString(),
            finishedOn: undefined,
            taskStatus: TaskDataStatus.RUNNING,
            iterations: 1
        });
        /**
         * Should end the task when there are no more items to process.
         */
        const resultAfterContinue = await handler.handle(event);

        expect(resultAfterContinue).toEqual(
            new ResponseDoneResult({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: task.definitionId,
                tenant: "root",
                locale: "en-US",
                message: "No more items to process - no last evaluated keys."
            })
        );

        const updatedTaskAfterContinue = await context.tasks.getTask(task.id);

        expect(updatedTaskAfterContinue).toEqual({
            ...task,
            input: {
                ...task.input,
                settings: {}
            },
            executionName: "someExecutionName",
            savedOn: expect.toBeDateString(),
            startedOn: expect.toBeDateString(),
            finishedOn: expect.toBeDateString(),
            taskStatus: TaskDataStatus.SUCCESS,
            iterations: 2
        });
    });
});
