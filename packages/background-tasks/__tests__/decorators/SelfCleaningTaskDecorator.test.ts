import { describe, it, expect, vi } from "vitest";
import { SelfCleaningTaskDecoratorImpl } from "~/api/decorators/SelfCleaningTaskDecorator.js";
import { TaskDataStatus } from "~/api/types.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { CleanupTaskSubtreeUseCase } from "~/api/features/CleanupTaskSubtree/index.js";
import type { ITask } from "~/api/types.js";

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

const makeCleanup = () => {
    const cleaned: string[] = [];
    const cleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface = {
        execute: async (id: string) => {
            cleaned.push(id);
        }
    };
    return { cleanupTaskSubtree, cleaned };
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

const noopCleanup: CleanupTaskSubtreeUseCase.Interface = {
    execute: async () => {}
};

describe("SelfCleaningTaskDecorator", () => {
    describe("normalization", () => {
        it("keeps databaseLogs when selfCleanup is undefined", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                noopCleanup,
                makeDefinition({ databaseLogs: true })
            );
            expect(dec.databaseLogs).toBe(true);
        });

        it("keeps databaseLogs when selfCleanup is 'never'", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                noopCleanup,
                makeDefinition({ databaseLogs: true, selfCleanup: "never" })
            );
            expect(dec.databaseLogs).toBe(true);
        });

        it("forces databaseLogs=false when selfCleanup is a single event", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                noopCleanup,
                makeDefinition({ databaseLogs: true, selfCleanup: "onSuccess" })
            );
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is an array", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                noopCleanup,
                makeDefinition({
                    databaseLogs: true,
                    selfCleanup: ["onSuccess", "onError"]
                })
            );
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is 'always'", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(
                noopCleanup,
                makeDefinition({ databaseLogs: true, selfCleanup: "always" })
            );
            expect(dec.databaseLogs).toBe(false);
        });
    });

    describe("hook exposure", () => {
        it("always exposes onDone / onError / onAbort even if the decoratee has none", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(noopCleanup, makeDefinition());
            expect(typeof dec.onDone).toBe("function");
            expect(typeof dec.onError).toBe("function");
            expect(typeof dec.onAbort).toBe("function");
        });
    });

    describe("cleanup gating", () => {
        it("does NOT trigger cleanup when event is not in the set", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = new SelfCleaningTaskDecoratorImpl(
                cleanupTaskSubtree,
                makeDefinition({ selfCleanup: "onError" })
            );
            await dec.onDone!({ task: fakeTask() });
            expect(cleaned).toEqual([]);
        });

        it("triggers cleanup on onSuccess when configured", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = new SelfCleaningTaskDecoratorImpl(
                cleanupTaskSubtree,
                makeDefinition({ selfCleanup: "onSuccess" })
            );
            await dec.onDone!({ task: fakeTask("t42") });
            expect(cleaned).toEqual(["t42"]);
        });

        it("triggers cleanup on onError when configured", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = new SelfCleaningTaskDecoratorImpl(
                cleanupTaskSubtree,
                makeDefinition({ selfCleanup: ["onError"] })
            );
            await dec.onError!({ task: fakeTask("t1") });
            expect(cleaned).toEqual(["t1"]);
        });

        it("triggers cleanup on onAbort when configured", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = new SelfCleaningTaskDecoratorImpl(
                cleanupTaskSubtree,
                makeDefinition({ selfCleanup: "always" })
            );
            await dec.onAbort!({ task: fakeTask() });
            expect(cleaned).toEqual(["t1"]);
        });
    });

    describe("hook wrapping", () => {
        it("invokes user's onDone before cleanup", async () => {
            const order: string[] = [];
            const cleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface = {
                execute: async () => {
                    order.push("cleanup");
                }
            };
            const dec = new SelfCleaningTaskDecoratorImpl(
                cleanupTaskSubtree,
                makeDefinition({
                    selfCleanup: "onSuccess",
                    onDone: async () => {
                        order.push("user");
                    }
                })
            );
            await dec.onDone!({ task: fakeTask() });
            expect(order).toEqual(["user", "cleanup"]);
        });

        it("runs cleanup even when user's hook throws", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            const dec = new SelfCleaningTaskDecoratorImpl(
                cleanupTaskSubtree,
                makeDefinition({
                    selfCleanup: "onSuccess",
                    onDone: async () => {
                        throw new Error("user-boom");
                    }
                })
            );
            await dec.onDone!({ task: fakeTask("t99") });
            expect(cleaned).toEqual(["t99"]);
            errSpy.mockRestore();
        });
    });
});
