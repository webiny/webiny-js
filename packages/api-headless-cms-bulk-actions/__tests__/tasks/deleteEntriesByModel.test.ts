import { createRunner } from "@webiny/project-utils/testing/tasks";
import { ResponseDoneResult, ResponseErrorResult } from "@webiny/tasks";
import { useHandler } from "~tests/context/useHandler";
import { createMockModels } from "~tests/mocks";
import { EntriesTask, HcmsBulkActionsContext } from "~/types";

import { createDeleteEntriesByModelTask } from "~/tasks/entries/deleteEntriesByModelTask";

const createDeletedEntries = async (
    context: HcmsBulkActionsContext,
    modelId: string,
    total = 100
) => {
    const model = await context.cms.getModel(modelId);

    if (!model) {
        throw new Error("Error while retrieving the model");
    }

    for (let i = 0; i < total; i++) {
        const entry = await context.cms.createEntry(model, { title: `Entry-${i}` });
        await context.cms.deleteEntry(model, entry.entryId, {
            permanently: false
        });
    }
};

const listDeletedEntries = async (context: HcmsBulkActionsContext, modelId: string) => {
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

jest.setTimeout(720000);

describe("deleteEntriesByModel", () => {
    it("should fail in case of invalid input - missing `modelId`", async () => {
        const taskDefinition = createDeleteEntriesByModelTask();
        const { handler } = useHandler<HcmsBulkActionsContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Mock Task",
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
            webinyTaskDefinitionId: EntriesTask.DeleteEntriesByModel,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should fail in case of not existing model", async () => {
        const taskDefinition = createDeleteEntriesByModelTask();
        const { handler } = useHandler<HcmsBulkActionsContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: "any-non-existing-modelId"
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
                message: `Content model "any-non-existing-modelId" was not found!`
            },
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.DeleteEntriesByModel,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should return success in case of no entries to delete", async () => {
        const taskDefinition = createDeleteEntriesByModelTask();
        const { handler } = useHandler<HcmsBulkActionsContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID
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
            message: `Task done: no entries found for model "car", skipping task creation.`,
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.DeleteEntriesByModel,
            tenant: "root",
            locale: "en-US"
        });
    });

    // TODO: Add test for when multiple task definitions are supported.
    it.skip("should delete multiple entries", async () => {
        const taskDefinition = createDeleteEntriesByModelTask();

        const { handler } = useHandler<HcmsBulkActionsContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const ENTRIES_COUNT = 200;

        await createDeletedEntries(context, MODEL_ID, ENTRIES_COUNT);
        const { entries, meta } = await listDeletedEntries(context, MODEL_ID);

        // Let's check how many entries we just created
        expect(meta.totalCount).toBe(ENTRIES_COUNT);

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID
            }
        });

        const runner = createRunner({
            context,
            task: taskDefinition
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        // Let's check we deleted all the entries
        const entriesAfterDeleteResponse = await listDeletedEntries(context, MODEL_ID);
        expect(entriesAfterDeleteResponse.meta.totalCount).toBe(0);

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            webinyTaskId: taskDefinition.id,
            webinyTaskDefinitionId: EntriesTask.DeleteEntriesByModel,
            tenant: "root",
            locale: "en-US",
            output: {
                done: entries,
                failed: []
            }
        });
    });

    // TODO: Add test for when multiple task definitions are supported.
    it.skip("should delete entries, with a custom `where` condition", async () => {
        const taskDefinition = createDeleteEntriesByModelTask();
        const { handler } = useHandler<HcmsBulkActionsContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const ENTRIES_COUNT = 10;

        await createDeletedEntries(context, MODEL_ID, ENTRIES_COUNT);
        const { entries, meta } = await listDeletedEntries(context, MODEL_ID);

        // Let's check how many entries we just created
        expect(meta.totalCount).toBe(ENTRIES_COUNT);

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
                where: {
                    title: "Entry-0"
                }
            }
        });

        const runner = createRunner({
            context,
            task: taskDefinition
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        // Let's check we deleted all the entries according to custom `where`provided
        const entriesAfterDeleteResponse = await listDeletedEntries(context, MODEL_ID);
        expect(entriesAfterDeleteResponse.meta.totalCount).toBe(ENTRIES_COUNT - 1);

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.DeleteEntriesByModel,
            tenant: "root",
            locale: "en-US",
            output: {
                done: entries.filter(entry => entry.values.title === "Entry-0"),
                failed: []
            }
        });
    });
});
