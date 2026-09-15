import { describe, it, expect, vi } from "vitest";
import { SelfCleaningTaskHandlerDecoratorImpl } from "~/api/decorators/SelfCleaningTaskHandlerDecorator.js";
import { TaskDataStatus } from "~/api/types.js";
import type {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { CleanupTaskSubtreeUseCase } from "~/api/features/CleanupTaskSubtree/index.js";
import type { Logger } from "@webiny/api-core/features/logger/index.js";
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

const makeLogger = () => {
    const errors: unknown[] = [];
    const logger = {
        error: (...args: unknown[]) => {
            errors.push(args);
        },
        warn: () => undefined,
        info: () => undefined,
        debug: () => undefined
    } as unknown as Logger.Interface;
    return { logger, errors };
};

const makeHandler = (overrides: Partial<TaskHandler.Interface> = {}): TaskHandler.Interface =>
    ({
        run: async () => ({ status: "done" }) as any,
        ...overrides
    }) as TaskHandler.Interface;

/**
 * The hooks are handed the definition, so a handler decorator reads `selfCleanup` from there rather
 * than from anything captured when it was built.
 */
const hookParams = (selfCleanup?: TaskDefinition.SelfCleanup, task = fakeTask()) =>
    ({
        task,
        definition: { id: "defA", title: "test", selfCleanup }
    }) as TaskHandler.LifecycleHookParams;

const noopCleanup: CleanupTaskSubtreeUseCase.Interface = {
    execute: async () => {}
};

describe("SelfCleaningTaskHandlerDecorator", () => {
    const decorate = (
        handler: TaskHandler.Interface,
        cleanup: CleanupTaskSubtreeUseCase.Interface = noopCleanup,
        logger: Logger.Interface = makeLogger().logger
    ) => new SelfCleaningTaskHandlerDecoratorImpl(cleanup, logger, handler);

    describe("hook exposure", () => {
        it("always exposes onDone / onError / onAbort even if the handler has none", () => {
            const dec = decorate(makeHandler());
            expect(typeof dec.onDone).toBe("function");
            expect(typeof dec.onError).toBe("function");
            expect(typeof dec.onAbort).toBe("function");
        });
    });

    describe("cleanup gating", () => {
        it("does NOT trigger cleanup when the event is not in the set", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = decorate(makeHandler(), cleanupTaskSubtree);

            await dec.onDone(hookParams("onAbort"));

            expect(cleaned).toEqual([]);
        });

        it("triggers cleanup on onSuccess when configured", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = decorate(makeHandler(), cleanupTaskSubtree);

            await dec.onDone(hookParams("onSuccess"));

            expect(cleaned).toEqual(["t1"]);
        });

        it("triggers cleanup on onError when configured", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = decorate(makeHandler(), cleanupTaskSubtree);

            await dec.onError(hookParams(["onError"]));

            expect(cleaned).toEqual(["t1"]);
        });

        it("triggers cleanup on onAbort when configured", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = decorate(makeHandler(), cleanupTaskSubtree);

            await dec.onAbort(hookParams("always"));

            expect(cleaned).toEqual(["t1"]);
        });

        it("reads selfCleanup per call, so one decorator serves every task", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const dec = decorate(makeHandler(), cleanupTaskSubtree);

            await dec.onDone(hookParams("never", fakeTask("keeps-itself")));
            await dec.onDone(hookParams("always", fakeTask("cleans-up")));

            expect(cleaned).toEqual(["cleans-up"]);
        });
    });

    describe("hook wrapping", () => {
        it("invokes the handler's onDone before cleanup", async () => {
            const calls: string[] = [];
            const cleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface = {
                execute: async () => {
                    calls.push("cleanup");
                }
            };
            const handler = makeHandler({
                onDone: async () => {
                    calls.push("userHook");
                }
            });

            const dec = decorate(handler, cleanupTaskSubtree);
            await dec.onDone(hookParams("always"));

            expect(calls).toEqual(["userHook", "cleanup"]);
        });

        it("runs cleanup even when the handler's hook throws", async () => {
            const { cleanupTaskSubtree, cleaned } = makeCleanup();
            const { logger, errors } = makeLogger();
            const handler = makeHandler({
                onDone: vi.fn().mockRejectedValue(new Error("boom"))
            });

            const dec = decorate(handler, cleanupTaskSubtree, logger);
            await dec.onDone(hookParams("always"));

            expect(cleaned).toEqual(["t1"]);
            expect(errors).toHaveLength(1);
        });
    });
});
