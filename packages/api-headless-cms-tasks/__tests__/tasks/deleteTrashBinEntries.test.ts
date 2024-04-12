import { createRunner } from "@webiny/project-utils/testing/tasks";
import { ResponseDoneResult, ResponseErrorResult } from "@webiny/tasks";
import { useHandler } from "~tests/context/useHandler";
import { createMockModels } from "~tests/mocks";
import { EntriesTask, HcmsTasksContext } from "~/types";

import { createDeleteTrashBinEntriesTask } from "~/tasks/entries/deleteTrashBinEntriesTask";

const createDeletedEntries = async (context: HcmsTasksContext, modelId: string, total = 100) => {
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

describe("Delete Trash Bin Entries", () => {
    it("should fail in case of not existing model", async () => {
        const taskDefinition = createDeleteTrashBinEntriesTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Delete Trash Bin Entries",
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
            webinyTaskDefinitionId: EntriesTask.DeleteTrashBinEntries,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should return success in case of no entries to delete", async () => {
        const taskDefinition = createDeleteTrashBinEntriesTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";

        const task = await context.tasks.createTask({
            name: "Delete Trash Bin Entries",
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
            message: "Task done: No entries to delete.",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.DeleteTrashBinEntries,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should delete entries multiple entries", async () => {
        const taskDefinition = createDeleteTrashBinEntriesTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const ENTRIES_COUNT = 50;

        await createDeletedEntries(context, MODEL_ID, ENTRIES_COUNT);
        const { entries, meta } = await listDeletedEntries(context, MODEL_ID);

        // Let's save the entryIds
        const entryIds = entries.map(entry => entry.entryId);

        // Let's check how many deleted entries we have been created
        expect(meta.totalCount).toBe(ENTRIES_COUNT);

        const task = await context.tasks.createTask({
            name: "Delete Trash Bin Entries",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
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

        // Let's check we just delete all the entries in the trash-bin
        const entriesAfterDeleteResponse = await listDeletedEntries(context, MODEL_ID);
        expect(entriesAfterDeleteResponse.meta.totalCount).toBe(0);

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.DeleteTrashBinEntries,
            tenant: "root",
            locale: "en-US",
            output: {
                done: entryIds,
                failed: []
            }
        });
    });
});
