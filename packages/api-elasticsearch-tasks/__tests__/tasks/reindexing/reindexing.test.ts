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
        values: {}
    });

    const event: ITaskEvent = {
        webinyTaskId: task.id,
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
        expect(result).toEqual(
            new ResponseDoneResult({
                webinyTaskId: task.id,
                tenant: "root",
                locale: "en-US",
                message: "No more items to process - no last evaluated keys."
            })
        );

        const updatedTask = await context.tasks.getTask(task.id);

        expect(updatedTask).toEqual({
            ...task,
            savedOn: expect.stringMatching(/^20/),
            startedOn: expect.stringMatching(/^20/),
            finishedOn: expect.stringMatching(/^20/),
            taskStatus: TaskDataStatus.SUCCESS,
            log: [
                {
                    message: "Task started.",
                    createdOn: expect.stringMatching(/^20/)
                },
                {
                    createdOn: expect.stringMatching(/^20/),
                    message: "No more items to process - no last evaluated keys."
                }
            ]
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
                tenant: "root",
                locale: "en-US",
                values: {}
            })
        );

        const updatedTask = await context.tasks.getTask(task.id);

        expect(updatedTask).toEqual({
            ...task,
            savedOn: expect.stringMatching(/^20/),
            startedOn: expect.stringMatching(/^20/),
            finishedOn: undefined,
            taskStatus: TaskDataStatus.RUNNING,
            log: [
                {
                    message: "Task started.",
                    createdOn: expect.stringMatching(/^20/)
                },
                {
                    createdOn: expect.stringMatching(/^20/),
                    message: "Task continuing.",
                    values: {}
                }
            ]
        });
        /**
         * Should end the task when there are no more items to process.
         */
        const resultAfterContinue = await handler.handle(event);

        expect(resultAfterContinue).toEqual(
            new ResponseDoneResult({
                webinyTaskId: task.id,
                tenant: "root",
                locale: "en-US",
                message: "No more items to process - no last evaluated keys."
            })
        );

        const updatedTaskAfterContinue = await context.tasks.getTask(task.id);

        expect(updatedTaskAfterContinue).toEqual({
            ...task,
            savedOn: expect.stringMatching(/^20/),
            startedOn: expect.stringMatching(/^20/),
            finishedOn: expect.stringMatching(/^20/),
            taskStatus: TaskDataStatus.SUCCESS,
            log: [
                {
                    message: "Task started.",
                    createdOn: expect.stringMatching(/^20/)
                },
                {
                    createdOn: expect.stringMatching(/^20/),
                    message: "Task continuing.",
                    values: {}
                },
                {
                    createdOn: expect.stringMatching(/^20/),
                    message: "No more items to process - no last evaluated keys."
                }
            ]
        });
    });
});
