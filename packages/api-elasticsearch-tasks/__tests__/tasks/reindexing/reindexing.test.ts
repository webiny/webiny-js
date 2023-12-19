/**
 * Tests in this file will use real data and Elasticsearch instance.
 */
import { useHandler } from "~tests/helpers/useHandler";
import { ResponseDoneResult } from "@webiny/tasks/response";
import { ITaskEvent } from "@webiny/tasks/handler/types";
import { TaskDataStatus } from "@webiny/tasks/types";

describe("reindexing", () => {
    it("should return a done response - no items at all to reindex", async () => {
        const handler = useHandler({});

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

        const result = await handler.handle(event, {
            getRemainingTimeInMillis: () => 1000000
        });
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
            status: TaskDataStatus.SUCCESS,
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
});
