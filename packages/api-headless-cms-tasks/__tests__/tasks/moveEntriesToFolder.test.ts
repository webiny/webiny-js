import { useHandler } from "~tests/context/useHandler";
import { EntriesTask, HcmsTasksContext } from "~/types";
import { createMockModels } from "~tests/mocks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { ResponseDoneResult, ResponseErrorResult } from "@webiny/tasks";
import { defaultIdentity as identity } from "../context/tenancySecurity";

import { createMoveEntriesToFolderTask } from "~/tasks/entries/moveEntriesToFolderTask";

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

const listEntries = async (context: HcmsTasksContext, modelId: string, folderId: string) => {
    const model = await context.cms.getModel(modelId);

    if (!model) {
        throw new Error("Error while retrieving the model");
    }

    const [entries, meta] = await context.cms.listEntries(model, {
        where: {
            latest: true,
            wbyAco_location: {
                folderId
            }
        },
        limit: 10000
    });

    return {
        entries,
        meta
    };
};

describe("Move Entries to Folder", () => {
    it("should fail in case of missing `modelId` in the input", async () => {
        const taskDefinition = createMoveEntriesToFolderTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Move entries to folder",
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
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolder,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should fail in case of missing `identity` in the input", async () => {
        const taskDefinition = createMoveEntriesToFolderTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Move entries to folder",
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
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolder,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should fail in case of missing `folderId` in the input", async () => {
        const taskDefinition = createMoveEntriesToFolderTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Move entries to folder",
            definitionId: taskDefinition.id,
            input: {
                modelId: "any-modelId",
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
                message: `Missing "folderId" in the input.`
            },
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolder,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should fail in case in case of not found model in the system", async () => {
        const taskDefinition = createMoveEntriesToFolderTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const task = await context.tasks.createTask({
            name: "Move entries to folder",
            definitionId: taskDefinition.id,
            input: {
                modelId: "any-not-existing-modelId",
                folderId: "any-folderId",
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
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolder,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should return success in case of no entries to move", async () => {
        const taskDefinition = createMoveEntriesToFolderTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const FOLDER_ID = "folder-1";

        const task = await context.tasks.createTask({
            name: "Move entries to folder",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
                folderId: FOLDER_ID,
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
            message: `Task done: no entries to move into folder ${FOLDER_ID}.`,
            webinyTaskId: task.id,
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolder,
            tenant: "root",
            locale: "en-US"
        });
    });

    it("should move multiple entries into a folder", async () => {
        const taskDefinition = createMoveEntriesToFolderTask();
        const { handler } = useHandler<HcmsTasksContext>({
            plugins: [taskDefinition, ...createMockModels()]
        });

        const context = await handler();

        const MODEL_ID = "car";
        const FOLDER_ID = "folder-1";
        const ENTRIES_COUNT = 50;

        await createEntries(context, MODEL_ID, ENTRIES_COUNT);
        const { entries: latestEntries, meta: latestMeta } = await listEntries(
            context,
            MODEL_ID,
            "root"
        );

        // Let's save the ids
        const ids = latestEntries.map(entry => entry.id);

        // Let's check how many entries we have just created
        expect(latestMeta.totalCount).toBe(ENTRIES_COUNT);

        const task = await context.tasks.createTask({
            name: "Move entries to folder",
            definitionId: taskDefinition.id,
            input: {
                modelId: MODEL_ID,
                folderId: FOLDER_ID,
                identity,
                ids
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
            webinyTaskDefinitionId: EntriesTask.MoveEntriesToFolder,
            tenant: "root",
            locale: "en-US",
            output: {
                done: ids,
                failed: []
            }
        });

        // Let's check that we moved all entries into new folder
        const { meta: movedMeta } = await listEntries(context, MODEL_ID, FOLDER_ID);
        expect(movedMeta.totalCount).toBe(latestMeta.totalCount);
    });
});
