import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivityLogPersistenceError } from "~/core/errors.js";
import { PurgeActivityRecordsTaskDefinition } from "~/cms/purge/PurgeActivityRecordsTaskDefinition.js";

/**
 * The purge task is modelled on `EmptyTrashBinTaskDefinition` and deliberately does not copy it.
 * These tests pin the two behaviours that task gets wrong: its loop can spin on a delete that
 * never succeeds, and a stalled tenant is never marked done.
 */

type DeleteResult = ReturnType<ActivityLogStorage.Interface["deleteAllForTarget"]>;

interface ControllerCalls {
    done: ReturnType<typeof vi.fn>;
    continue: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    aborted: ReturnType<typeof vi.fn>;
}

const buildTask = (deleteAllForTarget: (...args: unknown[]) => DeleteResult) => {
    const container = new Container();

    container.registerInstance(ActivityLogStorage, {
        append: vi.fn(),
        list: vi.fn(),
        deleteAllForTarget: vi.fn(deleteAllForTarget)
    } as unknown as ActivityLogStorage.Interface);

    container.register(PurgeActivityRecordsTaskDefinition);

    return container.resolve(TaskDefinition) as TaskDefinition.Interface<never, never>;
};

const buildController = (
    options: { aborted?: boolean; timeoutAfter?: number } = {}
): { controller: never; calls: ControllerCalls } => {
    let timeoutChecks = 0;

    const calls: ControllerCalls = {
        done: vi.fn((message: string, output: unknown) => ({ kind: "done", message, output })),
        continue: vi.fn((input: unknown) => ({ kind: "continue", input })),
        error: vi.fn((error: unknown) => ({ kind: "error", error })),
        aborted: vi.fn(() => ({ kind: "aborted" }))
    };

    const controller = {
        runtime: {
            isAborted: () => options.aborted === true,
            isCloseToTimeout: () => {
                timeoutChecks++;
                return options.timeoutAfter !== undefined && timeoutChecks > options.timeoutAfter;
            }
        },
        response: calls
    };

    return { controller: controller as never, calls };
};

const input = { targetType: "cms-entry" as const, targetId: "abc" };

describe("PurgeActivityRecordsTask", () => {
    it("finishes when storage reports the target clear", async () => {
        const task = buildTask(async () => Result.ok({ finished: true, deleted: 7 }) as never);
        const { controller, calls } = buildController();

        await task.run({ input, controller } as never);

        expect(calls.done).toHaveBeenCalled();
        expect(calls.done.mock.calls[0]![1]).toEqual({ deleted: 7 });
    });

    it("keeps going across chunks until the target is clear", async () => {
        let call = 0;
        const task = buildTask(async () => {
            call++;
            return Result.ok(
                call < 3 ? { finished: false, deleted: 50 } : { finished: true, deleted: 10 }
            ) as never;
        });
        const { controller, calls } = buildController();

        await task.run({ input, controller } as never);

        expect(call).toBe(3);
        expect(calls.done.mock.calls[0]![1]).toEqual({ deleted: 110 });
    });

    it("continues rather than finishing when it runs out of time", async () => {
        const task = buildTask(async () => Result.ok({ finished: false, deleted: 50 }) as never);
        const { controller, calls } = buildController({ timeoutAfter: 2 });

        await task.run({ input, controller } as never);

        expect(calls.done).not.toHaveBeenCalled();
        expect(calls.continue).toHaveBeenCalled();
        expect(calls.continue.mock.calls[0]![0]).toMatchObject({ deletedSoFar: 100 });
    });

    it("carries the running total across a continuation", async () => {
        const task = buildTask(async () => Result.ok({ finished: true, deleted: 5 }) as never);
        const { controller, calls } = buildController();

        await task.run({ input: { ...input, deletedSoFar: 40 }, controller } as never);

        expect(calls.done.mock.calls[0]![1]).toEqual({ deleted: 45 });
    });

    it("stops on a stall instead of spinning", async () => {
        // Work remains but nothing was deleted. This is the shape that makes
        // EmptyTrashBinTaskDefinition spin: it swallows the failure and re-reads the same page
        // until the timeout check breaks it, every iteration, forever.
        const task = buildTask(async () => Result.ok({ finished: false, deleted: 0 }) as never);
        const { controller, calls } = buildController();

        await task.run({ input, controller } as never);

        expect(calls.error).toHaveBeenCalled();
        expect(String(calls.error.mock.calls[0]![0])).toContain("Stalled");
        expect(calls.continue).not.toHaveBeenCalled();
    });

    it("reports a storage failure rather than retrying it", async () => {
        const task = buildTask(
            async () => Result.fail(new ActivityLogPersistenceError(new Error("boom"))) as never
        );
        const { controller, calls } = buildController();

        await task.run({ input, controller } as never);

        expect(calls.error).toHaveBeenCalled();
        expect(calls.done).not.toHaveBeenCalled();
    });

    it("honours an abort before touching storage", async () => {
        const deleteAllForTarget = vi.fn(
            async () => Result.ok({ finished: true, deleted: 0 }) as never
        );
        const task = buildTask(deleteAllForTarget);
        const { controller, calls } = buildController({ aborted: true });

        await task.run({ input, controller } as never);

        expect(calls.aborted).toHaveBeenCalled();
        expect(deleteAllForTarget).not.toHaveBeenCalled();
    });

    it("declares itself private, self-cleaning and bounded", async () => {
        const task = buildTask(async () => Result.ok({ finished: true, deleted: 0 }) as never);

        expect(task).toMatchObject({
            id: "activityLogPurgeTargetRecords",
            isPrivate: true,
            databaseLogs: false
        });
        expect((task as unknown as { maxIterations: number }).maxIterations).toBeGreaterThan(0);
    });
});
