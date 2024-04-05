import { createEmptyTrashBinsTask } from "~/tasks/entries/emptyTrashBins";
import { useHandler } from "~tests/context/useHandler";
import { EntriesTask, HeadlessCmsTasksContext } from "~/types";
import { createMockModels, createPrivateMockModels } from "~tests/mocks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { ResponseDoneResult } from "@webiny/tasks";
import { createEmptyTrashBinByModelTask } from "~/tasks/entries/emptyTrashBinByModel";

describe("Empty Trash Bins", () => {
    it("should execute and return a `Done` response in case of no found models in the system", async () => {
        const taskDefinition = createEmptyTrashBinsTask();
        const { handler } = useHandler<HeadlessCmsTasksContext>({
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
            message: "Task done: no public models found in the system.",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.EmptyTrashBins,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should execute and return a `Done` response in case of no public models found in the system", async () => {
        const taskDefinition = createEmptyTrashBinsTask();
        const { handler } = useHandler<HeadlessCmsTasksContext>({
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
            message: "Task done: no public models found in the system.",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.EmptyTrashBins,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should execute and return a `Done` response in case of models registered", async () => {
        const taskDefinition = createEmptyTrashBinsTask();
        const byModelTaskDefinition = createEmptyTrashBinByModelTask();
        const models = createMockModels();
        const { handler } = useHandler<HeadlessCmsTasksContext>({
            plugins: [taskDefinition, byModelTaskDefinition, ...models]
        });

        const context = await handler();

        const definitions = context.tasks.listDefinitions();

        console.log("definitions", definitions);

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

        console.log("result", result);

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
