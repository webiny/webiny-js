import { useHandler } from "~tests/context/useHandler";
import { EntriesTask, HcmsTasksContext } from "~/types";
import { createMockModels, createPrivateMockModels } from "~tests/mocks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { ResponseDoneResult } from "@webiny/tasks";

import { createEmptyTrashBinsTask } from "~/tasks/entries/emptyTrashBinsTask";

jest.setTimeout(100000);

describe("emptyTrashBins", () => {
    it("should execute and return a `Done` response in case of no found models in the system", async () => {
        const taskDefinition = createEmptyTrashBinsTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Delete all trash bin entries",
            definitionId: taskDefinition.id,
            input: {}
        });

        const runner = createRunner({
            context,
            task: taskDefinition
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            message: "Task done: emptying the trash bin for all registered models.",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.EmptyTrashBins,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should execute and return a `Done` response in case of no public models found in the system", async () => {
        const taskDefinition = createEmptyTrashBinsTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createPrivateMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Empty Trash Bins",
            definitionId: taskDefinition.id,
            input: {}
        });

        const runner = createRunner({
            context,
            task: taskDefinition
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            message: "Task done: emptying the trash bin for all registered models.",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.EmptyTrashBins,
            tenant: "root",
            locale: "en-US"
        });
    });

    // TODO: Add test for when multiple task definitions are supported.
    it.skip("should execute and return a `Done` response in case of models registered", async () => {
        const taskDefinition = createEmptyTrashBinsTask();
        const models = createMockModels();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...models]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Empty Trash Bins",
            definitionId: taskDefinition.id,
            input: {}
        });

        const runner = createRunner({
            context,
            task: taskDefinition
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            message: "Task done: no public models found in the system.",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.EmptyTrashBins,
            tenant: "root",
            locale: "en-US"
        });
    });
});
