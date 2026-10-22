import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { useHandler } from "~tests/utils/useHandler";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import { DeleteFolderUseCase } from "~/features/folder/DeleteFolder/index.js";
import { DeleteFlpUseCase } from "~/features/flp/DeleteFlp/index.js";
import {
    FOLDER_CREATED_WEBSOCKET_ACTION,
    FOLDER_DELETED_WEBSOCKET_ACTION,
    FOLDER_UPDATED_WEBSOCKET_ACTION
} from "~/features/folder/NotifyFolderChange/index.js";
import { CREATE_FLP_TASK_ID, UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";

const type = "type";
const viewer = { target: "admin:user1", level: "viewer" } as const;

const fakeController = (isCloseToTimeout: () => boolean) => ({
    runtime: { isAborted: () => false, isCloseToTimeout },
    response: {
        continue: (data: unknown) => ({ status: "continue", input: data }),
        done: (message: string) => ({ status: "done", message }),
        error: (error: unknown) => ({ status: "error", error }),
        aborted: () => ({ status: "aborted" })
    }
});

const taskHandler = (container: Container, id: string) => {
    const definition = container.resolveAll(TaskDefinition).find(candidate => candidate.id === id)!;
    const handler = container.resolveImplementation(definition.handler);
    return { definition, handler };
};

/*
 * Creating a folder already runs the create task (inline, in tests) and writes the FLP record. The
 * tests that run the task themselves remove that record first, so the task writes it again rather
 * than failing on a duplicate, as SQL storage does.
 */
const createFolderWithoutFlp = async (container: Container, slug: string) => {
    const created = await container.resolve(CreateFolderUseCase).execute({
        type,
        title: slug,
        slug,
        parentId: null
    });
    const folder = created.value;
    await container.resolve(DeleteFlpUseCase).execute(folder);
    return folder;
};

/** Says it is out of time from the `after`-th check onwards, like a task nearing its limit. */
const timeoutAfter = (after: number) => {
    let checks = 0;
    return () => ++checks >= after;
};

/*
 * In a deployment these tasks run after the request that changed the folder, and they are what tells
 * the admin: folder reads report the FLP records, so a message sent before they are written makes
 * the admin read the old permissions back.
 */
describe("FLP tasks tell the admin when they finish", () => {
    const { handler, websocketMessages } = useHandler();

    it("should tell the identity that created the folder once its FLP record exists", async () => {
        const context = await handler();
        const folder = await createFolderWithoutFlp(context.container, "notify-task-create");
        websocketMessages.length = 0;

        const { definition, handler: run } = taskHandler(context.container, CREATE_FLP_TASK_ID);
        await run.run({
            input: { folder, notifyIdentityId: "creator" },
            definition,
            controller: fakeController(() => false)
        } as never);

        expect(websocketMessages).toEqual([
            {
                identityId: "creator",
                action: FOLDER_CREATED_WEBSOCKET_ACTION,
                data: { id: folder.id }
            }
        ]);
    });

    it("should tell the identity that changed the folder once the whole subtree is written", async () => {
        const context = await handler();
        const createFolder = context.container.resolve(CreateFolderUseCase);
        const create = async (slug: string, parentId: string | null) => {
            const result = await createFolder.execute({ type, title: slug, slug, parentId });
            return result.value;
        };
        const a = await create("notify-a", null);
        const b = await create("notify-b", a.id);
        await create("notify-b1", b.id);
        await create("notify-b2", b.id);
        await create("notify-c", a.id);
        websocketMessages.length = 0;

        const { definition, handler: run } = taskHandler(context.container, UPDATE_FLP_TASK_ID);
        const input = { folder: { ...a, permissions: [viewer] }, notifyIdentityId: "changer" };

        // A run that runs out of time continues instead, and part of the subtree is still stale.
        const first = await run.run({
            input,
            definition,
            controller: fakeController(timeoutAfter(3))
        } as never);
        expect(first).toMatchObject({ status: "continue" });
        expect(websocketMessages).toEqual([]);

        const { input: continued } = first as unknown as { input: typeof input };
        const last = await run.run({
            input: continued,
            definition,
            controller: fakeController(() => false)
        } as never);
        expect(last).toMatchObject({ status: "done" });
        expect(websocketMessages).toEqual([
            {
                identityId: "changer",
                action: FOLDER_UPDATED_WEBSOCKET_ACTION,
                data: { id: a.id }
            }
        ]);
    });

    it("should tell nobody when the task was started without an identity", async () => {
        const context = await handler();
        const folder = await createFolderWithoutFlp(context.container, "notify-task-none");
        websocketMessages.length = 0;

        const { definition, handler: run } = taskHandler(context.container, CREATE_FLP_TASK_ID);
        const result = await run.run({
            input: { folder },
            definition,
            controller: fakeController(() => false)
        } as never);

        expect(result).toMatchObject({ status: "done" });
        expect(websocketMessages).toEqual([]);
    });
});

/*
 * A deleted folder is only dropped from the admin's cache, so the message goes out with the delete,
 * whatever made it: the GraphQL API, an AI tool or a direct use case call.
 */
describe("Deleting a folder tells the admin", () => {
    const { handler, websocketMessages } = useHandler();

    it("should tell the user's tabs which folder was deleted", async () => {
        const context = await handler();
        const created = await context.container.resolve(CreateFolderUseCase).execute({
            type,
            title: "notify-delete",
            slug: "notify-delete",
            parentId: null
        });
        const folder = created.value;
        websocketMessages.length = 0;

        const deleted = await context.container.resolve(DeleteFolderUseCase).execute(folder.id);

        expect(deleted.isOk()).toBe(true);
        expect(websocketMessages).toEqual([
            expect.objectContaining({
                action: FOLDER_DELETED_WEBSOCKET_ACTION,
                data: { id: folder.id }
            })
        ]);
    });
});
