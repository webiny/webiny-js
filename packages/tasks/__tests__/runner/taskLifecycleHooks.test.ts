import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "~/runner";
import { createMockEvent } from "~tests/mocks";
import { createLiveContextFactory } from "~tests/live";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TaskEventValidation } from "~/runner/TaskEventValidation";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { createContextPlugin } from "@webiny/api";
import { TaskDataStatus } from "~/types.js";

describe("task lifecycle hooks", () => {
    describe("onBeforeTrigger", () => {
        it("should call onBeforeTrigger when task is triggered", async () => {
            const onBeforeTrigger = vi.fn();

            class TestTask implements TaskDefinition.Interface {
                id = "testOnBeforeTrigger";
                title = "Test onBeforeTrigger";

                onBeforeTrigger = onBeforeTrigger;

                async run({ controller }: TaskDefinition.RunParams) {
                    return controller.response.done("Done", { result: true });
                }
            }

            const TestTaskDefinition = TaskDefinition.createImplementation({
                implementation: TestTask,
                dependencies: []
            });

            const contextFactory = createLiveContextFactory({
                plugins: [
                    createContextPlugin(context => {
                        context.container.register(TestTaskDefinition);
                    })
                ]
            });

            const context = await contextFactory();

            // Trigger should call onBeforeTrigger
            const task = await context.tasks.trigger({
                definition: "testOnBeforeTrigger",
                input: { test: "value" },
                name: "Test task"
            });

            expect(onBeforeTrigger).toHaveBeenCalledTimes(1);
            expect(onBeforeTrigger).toHaveBeenCalledWith({
                data: {
                    definitionId: "testOnBeforeTrigger",
                    name: "Test task",
                    input: { test: "value" },
                    parentId: undefined
                }
            });
        });
    });

    describe("onDone", () => {
        it("should call onDone when task completes successfully", async () => {
            const onDone = vi.fn();

            class TestTask implements TaskDefinition.Interface {
                id = "testOnDone";
                title = "Test onDone";

                onDone = onDone;

                async run({ controller }: TaskDefinition.RunParams) {
                    return controller.response.done("Task completed", {
                        result: "success"
                    });
                }
            }

            const TestTaskDefinition = TaskDefinition.createImplementation({
                implementation: TestTask,
                dependencies: []
            });

            const contextFactory = createLiveContextFactory({
                plugins: [
                    createContextPlugin(context => {
                        context.container.register(TestTaskDefinition);
                    })
                ]
            });

            const context = await contextFactory();
            const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

            const task = await context.tasks.createTask({
                definitionId: "testOnDone",
                input: { test: "input" },
                name: "Test task"
            });

            await runner.run(
                createMockEvent({
                    webinyTaskId: task.id,
                    webinyTaskDefinitionId: "testOnDone"
                })
            );

            expect(onDone).toHaveBeenCalledTimes(1);
            expect(onDone).toHaveBeenCalledWith({
                task: expect.objectContaining({
                    id: task.id,
                    definitionId: "testOnDone",
                    taskStatus: TaskDataStatus.SUCCESS,
                    input: { test: "input" },
                    output: expect.objectContaining({
                        result: "success"
                    })
                })
            });
        });
    });

    describe("onError", () => {
        it("should call onError when task fails", async () => {
            const onError = vi.fn();

            class TestTask implements TaskDefinition.Interface {
                id = "testOnError";
                title = "Test onError";

                onError = onError;

                async run({ controller }: TaskDefinition.RunParams) {
                    return controller.response.error("Task failed", {
                        message: "Something went wrong",
                        code: "TEST_ERROR"
                    });
                }
            }

            const TestTaskDefinition = TaskDefinition.createImplementation({
                implementation: TestTask,
                dependencies: []
            });

            const contextFactory = createLiveContextFactory({
                plugins: [
                    createContextPlugin(context => {
                        context.container.register(TestTaskDefinition);
                    })
                ]
            });

            const context = await contextFactory();
            const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

            const task = await context.tasks.createTask({
                definitionId: "testOnError",
                input: { test: "input" },
                name: "Test task"
            });

            await runner.run(
                createMockEvent({
                    webinyTaskId: task.id,
                    webinyTaskDefinitionId: "testOnError"
                })
            );

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith({
                task: expect.objectContaining({
                    id: task.id,
                    definitionId: "testOnError",
                    taskStatus: TaskDataStatus.FAILED,
                    input: { test: "input" }
                })
            });
        });
    });

    describe("onAbort", () => {
        it("should call onAbort when task is aborted", async () => {
            const onAbort = vi.fn();

            class TestTask implements TaskDefinition.Interface {
                id = "testOnAbort";
                title = "Test onAbort";

                onAbort = onAbort;

                async run({ controller }: TaskDefinition.RunParams) {
                    return controller.response.done("Done");
                }
            }

            const TestTaskDefinition = TaskDefinition.createImplementation({
                implementation: TestTask,
                dependencies: []
            });

            const contextFactory = createLiveContextFactory({
                plugins: [
                    createContextPlugin(context => {
                        context.container.register(TestTaskDefinition);
                    })
                ]
            });

            const context = await contextFactory();

            const task = await context.tasks.createTask({
                definitionId: "testOnAbort",
                input: { test: "input" },
                name: "Test task"
            });

            // Abort the task
            await context.tasks.abort({
                id: task.id,
                message: "Testing abort"
            });

            expect(onAbort).toHaveBeenCalledTimes(1);
            expect(onAbort).toHaveBeenCalledWith({
                task: expect.objectContaining({
                    id: task.id,
                    definitionId: "testOnAbort",
                    taskStatus: TaskDataStatus.ABORTED,
                    input: { test: "input" }
                })
            });
        });
    });

    describe("onMaxIterations", () => {
        it("should call onMaxIterations when task reaches max iterations", async () => {
            const onMaxIterations = vi.fn();

            class TestTask implements TaskDefinition.Interface {
                id = "testOnMaxIterations";
                title = "Test onMaxIterations";
                maxIterations = 2;

                onMaxIterations = onMaxIterations;

                async run({ input, controller }: TaskDefinition.RunParams) {
                    // Always continue to trigger max iterations
                    return controller.response.continue(input);
                }
            }

            const TestTaskDefinition = TaskDefinition.createImplementation({
                implementation: TestTask,
                dependencies: []
            });

            const contextFactory = createLiveContextFactory({
                plugins: [
                    createContextPlugin(context => {
                        context.container.register(TestTaskDefinition);
                    })
                ]
            });

            const context = await contextFactory();
            const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

            const task = await context.tasks.createTask({
                definitionId: "testOnMaxIterations",
                input: { test: "input" },
                name: "Test task"
            });

            // Run first iteration
            await runner.run(
                createMockEvent({
                    webinyTaskId: task.id,
                    webinyTaskDefinitionId: "testOnMaxIterations"
                })
            );

            // Run second iteration
            await runner.run(
                createMockEvent({
                    webinyTaskId: task.id,
                    webinyTaskDefinitionId: "testOnMaxIterations"
                })
            );

            // Third iteration should trigger onMaxIterations
            await runner.run(
                createMockEvent({
                    webinyTaskId: task.id,
                    webinyTaskDefinitionId: "testOnMaxIterations"
                })
            );

            expect(onMaxIterations).toHaveBeenCalledTimes(1);
            expect(onMaxIterations).toHaveBeenCalledWith({
                task: expect.objectContaining({
                    id: task.id,
                    definitionId: "testOnMaxIterations",
                    input: { test: "input" },
                    iterations: 2
                })
            });
        });
    });

    describe("multiple lifecycle hooks", () => {
        it("should call hooks in correct order for successful task", async () => {
            const calls: string[] = [];

            class TestTask implements TaskDefinition.Interface {
                id = "testMultipleHooks";
                title = "Test Multiple Hooks";

                async onBeforeTrigger() {
                    calls.push("onBeforeTrigger");
                }

                async onDone() {
                    calls.push("onDone");
                }

                async run({ controller }: TaskDefinition.RunParams) {
                    calls.push("run");
                    return controller.response.done("Done");
                }
            }

            const TestTaskDefinition = TaskDefinition.createImplementation({
                implementation: TestTask,
                dependencies: []
            });

            const contextFactory = createLiveContextFactory({
                plugins: [
                    createContextPlugin(context => {
                        context.container.register(TestTaskDefinition);
                    })
                ]
            });

            const context = await contextFactory();
            const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

            const task = await context.tasks.trigger({
                definition: "testMultipleHooks",
                input: {},
                name: "Test task"
            });

            await runner.run(
                createMockEvent({
                    webinyTaskId: task.id,
                    webinyTaskDefinitionId: "testMultipleHooks"
                })
            );

            expect(calls).toEqual(["onBeforeTrigger", "run", "onDone"]);
        });
    });
});
