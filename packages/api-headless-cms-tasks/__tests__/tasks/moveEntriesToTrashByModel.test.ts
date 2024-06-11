import { createRunner } from "@webiny/project-utils/testing/tasks";
import { ResponseDoneResult, ResponseErrorResult } from "@webiny/tasks";
import { useHandler } from "~tests/context/useHandler";
import { createMockModels } from "~tests/mocks";
import { EntriesTask, HcmsTasksContext } from "~/types";

import { createMoveEntriesToFolderByModelTask } from "~/tasks/entries/moveEntriesToFolderByModelTask";
import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";

const createEntries = async (
    context: HcmsTasksContext,
    modelId: string,
    folderId = "root",
    total = 100
) => {
    const model = await context.cms.getModel(modelId);

    if (!model) {
        throw new Error("Error while retrieving the model");
    }

    for (let i = 0; i < total; i++) {
        const entry = await context.cms.createEntry(model, { title: `Entry-${i}` });
        await context.cms.moveEntry(model, entry.id, folderId);
    }
};

const listLatestEntries = async (
    context: HcmsTasksContext,
    modelId: string,
    where = {} as CmsEntryListWhere
) => {
    const model = await context.cms.getModel(modelId);

    if (!model) {
        throw new Error("Error while retrieving the model");
    }

    const [entries, meta] = await context.cms.listLatestEntries(model, {
        where: {
            ...where
        },
        limit: 10000
    });

    return {
        entries,
        meta
    };
};

jest.setTimeout(720000);

describe("moveEntriesToFolderByModel", () => {
    it("should fail in case of invalid input - missing `modelId`", async () => {
        const taskDefinition = createMoveEntriesToFolderByModelTask();
        const { handler } = useHandler<HcmsTasksContext>({
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
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolderByModel,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should fail in case of invalid input - missing `data.folderId`", async () => {
        const taskDefinition = createMoveEntriesToFolderByModelTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: "any-model-id"
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
                message: `Missing "folderId" in the input.`
            },
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolderByModel,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should fail in case of not existing model", async () => {
        const taskDefinition = createMoveEntriesToFolderByModelTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: "any-non-existing-modelId",
                data: {
                    folderId: "any-folder-id"
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

        expect(result).toBeInstanceOf(ResponseErrorResult);

        expect(result).toMatchObject({
            status: "error",
            error: {
                message: `Content model "any-non-existing-modelId" was not found!`
            },
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolderByModel,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should return success in case of no entries to move", async () => {
        const taskDefinition = createMoveEntriesToFolderByModelTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const DESTINATION_FOLDER_ID = "destination-folder-id-1";

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
                data: {
                    folderId: DESTINATION_FOLDER_ID
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

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            message: `Task done: no entries found for model "${MODEL_ID}", skipping task creation.`,
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolderByModel,
            tenant: "root",
            locale: "en-US"
        });
    });

    // TODO: Add test for when multiple task definitions are supported.
    it.skip("should move multiple entries", async () => {
        const taskDefinition = createMoveEntriesToFolderByModelTask();

        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const SOURCE_FOLDER_ID = "source-folder-id-1";
        const DESTINATION_FOLDER_ID = "destination-folder-id-1";
        const ENTRIES_COUNT = 200;

        await createEntries(context, MODEL_ID, SOURCE_FOLDER_ID, ENTRIES_COUNT);
        const { entries, meta } = await listLatestEntries(context, MODEL_ID, {
            wbyAco_location: {
                folderId: SOURCE_FOLDER_ID
            }
        });

        // Let's check how many entries we just created
        expect(meta.totalCount).toBe(ENTRIES_COUNT);

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
                data: {
                    folderId: DESTINATION_FOLDER_ID
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

        // Let's check we just move all the entries
        const entriesAfterMoveResponse = await listLatestEntries(context, MODEL_ID, {
            wbyAco_location: {
                folderId: DESTINATION_FOLDER_ID
            }
        });
        expect(entriesAfterMoveResponse.meta.totalCount).toBe(ENTRIES_COUNT);

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            webinyTaskId: taskDefinition.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolderByModel,
            tenant: "root",
            locale: "en-US",
            output: {
                done: entries,
                failed: []
            }
        });
    });

    // TODO: Add test for when multiple task definitions are supported.
    it.skip("should move entries, with a custom `where` condition", async () => {
        const taskDefinition = createMoveEntriesToFolderByModelTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const SOURCE_FOLDER_ID = "source-folder-id-1";
        const DESTINATION_FOLDER_ID = "destination-folder-id-1";
        const ENTRIES_COUNT = 200;

        await createEntries(context, MODEL_ID, SOURCE_FOLDER_ID, ENTRIES_COUNT);
        const { entries, meta } = await listLatestEntries(context, MODEL_ID, {
            wbyAco_location: {
                folderId: SOURCE_FOLDER_ID
            }
        });

        // Let's check how many entries we just created
        expect(meta.totalCount).toBe(ENTRIES_COUNT);

        const task = await context.tasks.createTask({
            name: "Mock Task",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
                data: {
                    folderId: DESTINATION_FOLDER_ID
                },
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

        // Let's check we moved all the entries according to custom `where`provided
        const entriesAfterMoveResponse = await listLatestEntries(context, MODEL_ID, {
            wbyAco_location: {
                folderId: SOURCE_FOLDER_ID
            }
        });
        expect(entriesAfterMoveResponse.meta.totalCount).toBe(ENTRIES_COUNT - 1);

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toMatchObject({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolderByModel,
            tenant: "root",
            locale: "en-US",
            output: {
                done: entries.filter(entry => entry.values.title === "Entry-0"),
                failed: []
            }
        });
    });
});
