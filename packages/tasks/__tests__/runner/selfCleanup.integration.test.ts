import { describe, it, expect } from "vitest";
import { TaskRunner } from "~/runner";
import { createMockEvent } from "~tests/mocks";
import { createLiveContextFactory } from "~tests/live";
import { TaskEventValidation } from "~/runner/TaskEventValidation";
import { timerFactory } from "@webiny/handler-aws/utils";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";

const runTask = async (
    context: Awaited<ReturnType<ReturnType<typeof createLiveContextFactory>>>,
    definitionId: string,
    input: Record<string, unknown> = {}
) => {
    const task = await context.tasks.createTask({
        definitionId,
        input,
        name: `run-${definitionId}`
    });
    const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());
    await runner.run(
        createMockEvent({
            webinyTaskId: task.id,
            webinyTaskDefinitionId: definitionId
        })
    );
    return task;
};

describe("selfCleanup integration", () => {
    it("selfCleanup='onSuccess' deletes the task on DONE", async () => {
        const plugin = createTaskDefinition({
            id: "cleanupOnSuccess",
            title: "cleanupOnSuccess",
            selfCleanup: "onSuccess",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();

        const task = await runTask(context, "cleanupOnSuccess");

        expect(await context.tasks.getTask(task.id)).toBeNull();
    });

    it("selfCleanup='onSuccess' does NOT delete on ERROR", async () => {
        const plugin = createTaskDefinition({
            id: "cleanupErrOnlyOnSuccess",
            title: "cleanupErrOnlyOnSuccess",
            selfCleanup: "onSuccess",
            run: async ({ controller }) =>
                controller.response.error({ message: "boom", code: "TEST_ERR" })
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();

        const task = await runTask(context, "cleanupErrOnlyOnSuccess");

        expect(await context.tasks.getTask(task.id)).not.toBeNull();
    });

    it("selfCleanup='always' deletes the task and writes no logs", async () => {
        const plugin = createTaskDefinition({
            id: "cleanupAlways",
            title: "cleanupAlways",
            databaseLogs: true, // forced to false by the decorator
            selfCleanup: "always",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();

        const task = await runTask(context, "cleanupAlways");

        expect(await context.tasks.getTask(task.id)).toBeNull();

        const { items } = await context.tasks.listLogs({ where: { task: task.id } });
        expect(items).toHaveLength(0);
    });

    it("selfCleanup on parent deletes the full descendant tree", async () => {
        const parentPlugin = createTaskDefinition({
            id: "cleanupParent",
            title: "cleanupParent",
            selfCleanup: "onSuccess",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const childPlugin = createTaskDefinition({
            id: "cleanupChild",
            title: "cleanupChild",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const contextFactory = createLiveContextFactory({
            plugins: [parentPlugin, childPlugin]
        });
        const context = await contextFactory();

        const parent = await context.tasks.createTask({
            definitionId: "cleanupParent",
            input: {},
            name: "parent"
        });
        await context.tasks.createTask({
            definitionId: "cleanupChild",
            input: {},
            name: "child-1",
            parentId: parent.id
        });
        await context.tasks.createTask({
            definitionId: "cleanupChild",
            input: {},
            name: "child-2",
            parentId: parent.id
        });

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());
        await runner.run(
            createMockEvent({
                webinyTaskId: parent.id,
                webinyTaskDefinitionId: "cleanupParent"
            })
        );

        expect(await context.tasks.getTask(parent.id)).toBeNull();
        const remaining = await context.tasks.listTasks({
            where: { parentId: parent.id }
        });
        expect(remaining.items).toHaveLength(0);
    });

    it("selfCleanup='onAbort' deletes the task on abort", async () => {
        const plugin = createTaskDefinition({
            id: "cleanupOnAbort",
            title: "cleanupOnAbort",
            selfCleanup: "onAbort",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();

        const task = await context.tasks.createTask({
            definitionId: "cleanupOnAbort",
            input: {},
            name: "to-abort"
        });
        await context.tasks.abort({ id: task.id, message: "testing cleanup on abort" });

        expect(await context.tasks.getTask(task.id)).toBeNull();
    });
});
