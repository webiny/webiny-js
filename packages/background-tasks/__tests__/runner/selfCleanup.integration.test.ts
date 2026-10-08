import { describe, it, expect } from "vitest";
import { TaskRunner } from "~/api/runner";
import { createMockEvent } from "~tests/mocks";
import { createLiveContextFactory } from "~tests/live";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation";
import { timerFactory } from "@webiny/utils/features/Timer/factory.js";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";
import { AbortTaskUseCase } from "~/api/features/AbortTask/abstractions.js";
import { CreateTaskUseCase } from "~/api/features/CreateTask/index.js";
import { GetTaskUseCase } from "~/api/features/GetTask/index.js";
import { ListTasksUseCase } from "~/api/features/ListTasks/index.js";
import { TaskLogsRepository } from "~/api/domain/task/abstractions.js";

const runTask = async (
    context: Awaited<ReturnType<ReturnType<typeof createLiveContextFactory>>>,
    definitionId: string,
    input: Record<string, unknown> = {}
) => {
    const task = (
        await context.container.resolve(CreateTaskUseCase).execute({
            definitionId,
            input,
            name: `run-${definitionId}`
        })
    ).value;
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

        expect(await context.container.resolve(GetTaskUseCase).execute(task.id)).toBeNull();
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

        expect(await context.container.resolve(GetTaskUseCase).execute(task.id)).not.toBeNull();
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

        expect(await context.container.resolve(GetTaskUseCase).execute(task.id)).toBeNull();

        const { items } = (
            await context.container.resolve(TaskLogsRepository).list({ where: { task: task.id } })
        ).value;
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

        const parent = (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupParent",
                input: {},
                name: "parent"
            })
        ).value;
        (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupChild",
                input: {},
                name: "child-1",
                parentId: parent.id
            })
        ).value;
        (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupChild",
                input: {},
                name: "child-2",
                parentId: parent.id
            })
        ).value;

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());
        await runner.run(
            createMockEvent({
                webinyTaskId: parent.id,
                webinyTaskDefinitionId: "cleanupParent"
            })
        );

        expect(await context.container.resolve(GetTaskUseCase).execute(parent.id)).toBeNull();
        const remaining = await context.container.resolve(ListTasksUseCase).execute({
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

        const task = (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupOnAbort",
                input: {},
                name: "to-abort"
            })
        ).value;
        await context.container
            .resolve(AbortTaskUseCase)
            .execute({ id: task.id, message: "testing cleanup on abort" });

        expect(await context.container.resolve(GetTaskUseCase).execute(task.id)).toBeNull();
    });

    it("selfCleanup='onError' deletes the task on ERROR", async () => {
        const plugin = createTaskDefinition({
            id: "cleanupOnError",
            title: "cleanupOnError",
            selfCleanup: "onError",
            run: async ({ controller }) =>
                controller.response.error({ message: "boom", code: "TEST_ERR" })
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();

        const task = await runTask(context, "cleanupOnError");

        expect(await context.container.resolve(GetTaskUseCase).execute(task.id)).toBeNull();
    });

    it("selfCleanup array form cleans up on any matching event", async () => {
        const doneDef = createTaskDefinition({
            id: "cleanupArrayDone",
            title: "cleanupArrayDone",
            selfCleanup: ["onSuccess", "onError"],
            run: async ({ controller }) => controller.response.done("ok")
        });
        const errDef = createTaskDefinition({
            id: "cleanupArrayError",
            title: "cleanupArrayError",
            selfCleanup: ["onSuccess", "onError"],
            run: async ({ controller }) =>
                controller.response.error({ message: "boom", code: "TEST_ERR" })
        });
        const contextFactory = createLiveContextFactory({ plugins: [doneDef, errDef] });
        const context = await contextFactory();

        const doneTask = await runTask(context, "cleanupArrayDone");
        const errTask = await runTask(context, "cleanupArrayError");

        expect(await context.container.resolve(GetTaskUseCase).execute(doneTask.id)).toBeNull();
        expect(await context.container.resolve(GetTaskUseCase).execute(errTask.id)).toBeNull();
    });

    it("user's onDone runs before cleanup fires", async () => {
        const order: string[] = [];
        const contextRef: {
            current?: Awaited<ReturnType<ReturnType<typeof createLiveContextFactory>>>;
        } = {};

        const plugin = createTaskDefinition({
            id: "cleanupOrderTask",
            title: "cleanupOrderTask",
            selfCleanup: "onSuccess",
            run: async ({ controller }) => controller.response.done("ok"),
            onDone: async ({ task }) => {
                // Task must still exist while the user's hook runs.
                const live = await contextRef
                    .current!.container.resolve(GetTaskUseCase)
                    .execute(task.id);
                order.push(live ? "user-saw-task" : "user-task-gone");
            }
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();
        contextRef.current = context;

        const task = await runTask(context, "cleanupOrderTask");

        // After the run finishes: user hook observed the task, cleanup then removed it.
        expect(order).toEqual(["user-saw-task"]);
        expect(await context.container.resolve(GetTaskUseCase).execute(task.id)).toBeNull();
    });

    it("cascade deletes grandchildren (3 levels deep)", async () => {
        const parent = createTaskDefinition({
            id: "cleanupDeepParent",
            title: "cleanupDeepParent",
            selfCleanup: "onSuccess",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const child = createTaskDefinition({
            id: "cleanupDeepChild",
            title: "cleanupDeepChild",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const grandchild = createTaskDefinition({
            id: "cleanupDeepGrandchild",
            title: "cleanupDeepGrandchild",
            run: async ({ controller }) => controller.response.done("ok")
        });

        const contextFactory = createLiveContextFactory({
            plugins: [parent, child, grandchild]
        });
        const context = await contextFactory();

        const p = (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupDeepParent",
                input: {},
                name: "p"
            })
        ).value;
        const c = (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupDeepChild",
                input: {},
                name: "c",
                parentId: p.id
            })
        ).value;
        const g = (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupDeepGrandchild",
                input: {},
                name: "g",
                parentId: c.id
            })
        ).value;

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());
        await runner.run(
            createMockEvent({
                webinyTaskId: p.id,
                webinyTaskDefinitionId: "cleanupDeepParent"
            })
        );

        expect(await context.container.resolve(GetTaskUseCase).execute(p.id)).toBeNull();
        expect(await context.container.resolve(GetTaskUseCase).execute(c.id)).toBeNull();
        expect(await context.container.resolve(GetTaskUseCase).execute(g.id)).toBeNull();
    });

    it("cascade sweeps child logs when the child definition has databaseLogs=true", async () => {
        const parent = createTaskDefinition({
            id: "cleanupMixedParent",
            title: "cleanupMixedParent",
            selfCleanup: "onSuccess",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const child = createTaskDefinition({
            id: "cleanupMixedChild",
            title: "cleanupMixedChild",
            databaseLogs: true, // stays true on the child — no selfCleanup on it
            run: async ({ controller }) => controller.response.done("ok")
        });

        const contextFactory = createLiveContextFactory({ plugins: [parent, child] });
        const context = await contextFactory();

        const p = (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupMixedParent",
                input: {},
                name: "p"
            })
        ).value;
        const c = (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: "cleanupMixedChild",
                input: {},
                name: "c",
                parentId: p.id
            })
        ).value;
        // Seed a log row on the child.
        (
            await context.container.resolve(TaskLogsRepository).create(c, {
                executionName: "seed",
                iteration: 1
            })
        ).value;

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());
        await runner.run(
            createMockEvent({
                webinyTaskId: p.id,
                webinyTaskDefinitionId: "cleanupMixedParent"
            })
        );

        expect(await context.container.resolve(GetTaskUseCase).execute(p.id)).toBeNull();
        expect(await context.container.resolve(GetTaskUseCase).execute(c.id)).toBeNull();

        const { items } = (
            await context.container.resolve(TaskLogsRepository).list({ where: { task: c.id } })
        ).value;
        expect(items).toHaveLength(0);
    });

    it("selfCleanup='never' leaves the task in place after DONE", async () => {
        const plugin = createTaskDefinition({
            id: "cleanupNever",
            title: "cleanupNever",
            selfCleanup: "never",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();

        const task = await runTask(context, "cleanupNever");

        expect(await context.container.resolve(GetTaskUseCase).execute(task.id)).not.toBeNull();
    });
});
