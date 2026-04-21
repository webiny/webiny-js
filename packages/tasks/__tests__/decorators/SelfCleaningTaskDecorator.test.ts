import { describe, it, expect, vi } from "vitest";
import { SelfCleaningTaskDecoratorImpl } from "~/decorators/SelfCleaningTaskDecorator.js";
import { TaskDataStatus } from "~/types.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Context, ITask } from "~/types.js";

const fakeTask = (id = "t1"): ITask =>
    ({
        id,
        definitionId: "defA",
        name: id,
        input: {},
        taskStatus: TaskDataStatus.SUCCESS,
        createdBy: { id: "u", displayName: "u", type: "user" },
        createdOn: "",
        savedOn: "",
        executionName: "",
        iterations: 0
    }) as unknown as ITask;

const makeContext = () => {
    const cleaned: string[] = [];
    const context = {
        tasks: {
            cleanupTaskSubtree: async (id: string) => {
                cleaned.push(id);
            }
        }
    } as unknown as Context;
    return { context, cleaned };
};

const makeDefinition = (
    overrides: Partial<TaskDefinition.Interface> = {}
): TaskDefinition.Interface =>
    ({
        id: "defA",
        title: "test",
        run: async () => ({ status: "done" }) as any,
        ...overrides
    }) as TaskDefinition.Interface;

describe("SelfCleaningTaskDecorator", () => {
    describe("normalization", () => {
        it("keeps databaseLogs when selfCleanup is undefined", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(makeDefinition({ databaseLogs: true }));
            expect(dec.databaseLogs).toBe(true);
        });

        it("keeps databaseLogs when selfCleanup is 'never'", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ databaseLogs: true, selfCleanup: "never" })
            );
            expect(dec.databaseLogs).toBe(true);
        });

        it("forces databaseLogs=false when selfCleanup is a single event", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ databaseLogs: true, selfCleanup: "onSuccess" })
            );
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is an array", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({
                    databaseLogs: true,
                    selfCleanup: ["onSuccess", "onError"]
                })
            );
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is 'always'", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ databaseLogs: true, selfCleanup: "always" })
            );
            expect(dec.databaseLogs).toBe(false);
        });
    });

    describe("hook exposure", () => {
        it("always exposes onDone / onError / onAbort even if the decoratee has none", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(makeDefinition());
            expect(typeof dec.onDone).toBe("function");
            expect(typeof dec.onError).toBe("function");
            expect(typeof dec.onAbort).toBe("function");
        });
    });

    describe("cleanup gating", () => {
        it("does NOT trigger cleanup when event is not in the set", async () => {
            const { context, cleaned } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ selfCleanup: "onError" })
            );
            await dec.onDone!({ task: fakeTask(), context });
            expect(cleaned).toEqual([]);
        });

        it("triggers cleanup on onSuccess when configured", async () => {
            const { context, cleaned } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ selfCleanup: "onSuccess" })
            );
            await dec.onDone!({ task: fakeTask("t42"), context });
            expect(cleaned).toEqual(["t42"]);
        });

        it("triggers cleanup on onError when configured", async () => {
            const { context, cleaned } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ selfCleanup: ["onError"] })
            );
            await dec.onError!({ task: fakeTask("t1"), context });
            expect(cleaned).toEqual(["t1"]);
        });

        it("triggers cleanup on onAbort when configured", async () => {
            const { context, cleaned } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ selfCleanup: "always" })
            );
            await dec.onAbort!({ task: fakeTask(), context });
            expect(cleaned).toEqual(["t1"]);
        });
    });

    describe("hook wrapping", () => {
        it("invokes user's onDone before cleanup", async () => {
            const order: string[] = [];
            const context = {
                tasks: {
                    cleanupTaskSubtree: async () => {
                        order.push("cleanup");
                    }
                }
            } as unknown as Context;
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({
                    selfCleanup: "onSuccess",
                    onDone: async () => {
                        order.push("user");
                    }
                })
            );
            await dec.onDone!({ task: fakeTask(), context });
            expect(order).toEqual(["user", "cleanup"]);
        });

        it("runs cleanup even when user's hook throws", async () => {
            const { context, cleaned } = makeContext();
            const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({
                    selfCleanup: "onSuccess",
                    onDone: async () => {
                        throw new Error("user-boom");
                    }
                })
            );
            await dec.onDone!({ task: fakeTask("t99"), context });
            expect(cleaned).toEqual(["t99"]);
            errSpy.mockRestore();
        });
    });
});
