import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { useHandler } from "~tests/utils/useHandler";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import { UpdateFlpUseCase } from "~/features/flp/UpdateFlp/index.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import type { Folder } from "~/folder/folder.types";

const type = "type";
const viewer = { target: "admin:user1", level: "viewer" } as const;

/*
 *        a
 *      /   \
 *     b     c
 *    / \     \
 *   b1  b2    c1
 */
const createTree = async (container: Container) => {
    const createFolder = container.resolve(CreateFolderUseCase);
    const create = async (slug: string, parentId: string | null) => {
        const result = await createFolder.execute({ type, title: slug, slug, parentId });
        return result.value;
    };

    const a = await create("a", null);
    const b = await create("b", a.id);
    const b1 = await create("b1", b.id);
    const b2 = await create("b2", b.id);
    const c = await create("c", a.id);
    const c1 = await create("c1", c.id);

    return { a, b, b1, b2, c, c1 };
};

const inheritsViewer = async (container: Container, folder: Folder) => {
    const flp = await container.resolve(AcoFlpCrud).get(folder.id);
    return (flp?.permissions ?? []).some(p => p.target === viewer.target);
};

/** Says it is out of time from the `after`-th check onwards, like a task nearing its limit. */
const timeoutAfter = (after: number) => {
    let checks = 0;
    return () => ++checks >= after;
};

describe("Update FLP across task runs", () => {
    const { handler } = useHandler();

    it("should finish the whole subtree when a run times out partway through a branch", async () => {
        const context = await handler();
        const tree = await createTree(context.container);
        const folder = { ...tree.a, permissions: [viewer] };

        /*
         * Every run gets the same small budget, so each one stops partway. The update only finishes
         * if a continued run picks up where the last one stopped rather than starting over.
         */
        let completed: string[] | undefined;
        let runs = 0;
        let finished = false;

        while (!finished && runs < 10) {
            runs++;
            let continueWith: string[] | undefined;

            // A fresh use case per run, the way a continued task gets one.
            await context.container.resolve(UpdateFlpUseCase).execute({
                folder,
                completed,
                isCloseToTimeout: timeoutAfter(3),
                handleTimeout: next => {
                    continueWith = next;
                }
            });

            finished = continueWith === undefined;
            completed = continueWith;
        }

        expect(finished).toBe(true);
        // More than one run, so the continuation was actually exercised.
        expect(runs).toBeGreaterThan(1);

        for (const descendant of [tree.b, tree.b1, tree.b2, tree.c, tree.c1]) {
            await expect(inheritsViewer(context.container, descendant)).resolves.toBe(true);
        }
    });

    it("should hand over at most once per run", async () => {
        const context = await handler();
        const tree = await createTree(context.container);

        let handovers = 0;
        await context.container.resolve(UpdateFlpUseCase).execute({
            folder: { ...tree.a, permissions: [viewer] },
            isCloseToTimeout: timeoutAfter(2),
            handleTimeout: () => {
                handovers++;
            }
        });

        expect(handovers).toBe(1);
    });

    it("should continue the task instead of reporting it done when time runs out", async () => {
        const context = await handler();
        const tree = await createTree(context.container);

        const definition = context.container
            .resolveAll(TaskDefinition)
            .find(candidate => candidate.id === UPDATE_FLP_TASK_ID)!;
        const taskHandler = context.container.resolveImplementation(definition.handler);

        const input = { folder: { ...tree.a, permissions: [viewer] } };
        const result = await taskHandler.run({
            input,
            definition,
            controller: {
                runtime: { isAborted: () => false, isCloseToTimeout: timeoutAfter(2) },
                response: {
                    continue: (data: unknown) => ({ status: "continue", input: data }),
                    done: (message: string) => ({ status: "done", message }),
                    error: (error: unknown) => ({ status: "error", error }),
                    aborted: () => ({ status: "aborted" })
                }
            }
        } as never);

        expect(result).toMatchObject({ status: "continue", input: { folder: input.folder } });
    });
});
