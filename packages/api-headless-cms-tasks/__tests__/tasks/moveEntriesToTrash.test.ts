import { useHandler } from "~tests/context/useHandler";
import { EntriesTask, HcmsTasksContext } from "~/types";
import { createMockModels } from "~tests/mocks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { ResponseDoneResult, ResponseErrorResult } from "@webiny/tasks";
import { defaultIdentity as identity } from "../context/tenancySecurity";

import { createMoveEntriesToTrashTask } from "~/tasks/entries/moveEntriesToTrashTask";

jest.setTimeout(100000);

const createEntries = async (context: HcmsTasksContext, modelId: string, total = 100) => {
    const model = await context.cms.getModel(modelId);

    if (!model) {
        throw new Error("Error while retrieving the model");
    }

    for (let i = 0; i < total; i++) {
        await context.cms.createEntry(model, { title: `Entry-${i}` });
    }

    // Let's wait a little bit...we need the ES index to settle down.
    await new Promise(res => setTimeout(res, 5000));
};

const listEntries = async (context: HcmsTasksContext, modelId: string) => {
    const model = await context.cms.getModel(modelId);

    if (!model) {
        throw new Error("Error while retrieving the model");
    }

    const [entries, meta] = await context.cms.listEntries(model, {
        where: {
            latest: true
        },
        limit: 10000
    });

    return {
        entries,
        meta
    };
};

const listDeletedEntries = async (context: HcmsTasksContext, modelId: string) => {
    const model = await context.cms.getModel(modelId);

    if (!model) {
        throw new Error("Error while retrieving the model");
    }

    const [entries, meta] = await context.cms.listDeletedEntries(model, { limit: 10000 });

    return {
        entries,
        meta
    };
};

describe("Move Entries to Trash Bin", () => {
    it("should fail in case of missing `modelId` in the input", async () => {
        const taskDefinition = createMoveEntriesToTrashTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Move entries to trash bin",
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

        expect(result).toBeInstanceOf(ResponseErrorResult);

        expect(result).toMatchObject({
            status: "error",
            error: {
                message: `Missing "modelId" in the input.`
            },
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToTrash,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should fail in case of missing `identity` in the input", async () => {
        const taskDefinition = createMoveEntriesToTrashTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Move entries to trash bin",
            definitionId: taskDefinition.id,
            input: {
                modelId: "any-modelId"
            }
        });

        const runner = createRunner({
            context,
            task: taskDefinition
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);

        expect(result).toMatchObject({
            status: "error",
            error: {
                message: `Missing "identity" in the input.`
            },
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToTrash,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should fail in case in case of not found model in the system", async () => {
        const taskDefinition = createMoveEntriesToTrashTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Move entries to trash bin",
            definitionId: taskDefinition.id,
            input: {
                modelId: "any-not-existing-modelId",
                identity
            }
        });

        const runner = createRunner({
            context,
            task: taskDefinition
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);

        expect(result).toMatchObject({
            status: "error",
            error: {
                message: `Content model "any-not-existing-modelId" was not found!`
            },
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToTrash,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should return success in case of no entries to move into trash bin", async () => {
        const taskDefinition = createMoveEntriesToTrashTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";

        const task = await context.tasks.createTask({
            name: "Move entries to trash bin",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
                identity
            }
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
            message: `Task done: no entries to move into trash bin.`,
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToTrash,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should move multiple entries into trash bin", async () => {
        const taskDefinition = createMoveEntriesToTrashTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const ENTRIES_COUNT = 50;

        await createEntries(context, MODEL_ID, ENTRIES_COUNT);
        const { entries: latestEntries, meta: latestMeta } = await listEntries(context, MODEL_ID);

        // Let's save the entryIds
        const entryIds = latestEntries.map(entry => entry.entryId);

        // Let's check how many entries we have just created
        expect(latestMeta.totalCount).toBe(ENTRIES_COUNT);

        const task = await context.tasks.createTask({
            name: "Move entries to trash bin",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
                identity,
                entryIds
            }
        });

        const runner = createRunner({
            context,
            task: taskDefinition
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toMatchObject({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToTrash,
            tenant: "root",
            locale: "en-US",
            output: {
                done: entryIds,
                failed: []
            }
        });

        // Let's check that we moved all entries into the trash bin
        const { meta: deletedMeta } = await listDeletedEntries(context, MODEL_ID);
        expect(deletedMeta.totalCount).toBe(latestMeta.totalCount);
    });
});
