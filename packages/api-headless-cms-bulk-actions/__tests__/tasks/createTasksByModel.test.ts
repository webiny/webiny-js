/**
 * Guards termination of the bulk-action list loop.
 *
 * The loop is CREATE_SUBTASKS → PROCESS_SUBTASKS → CHECK_MORE_SUBTASKS → CREATE_SUBTASKS, and every
 * CHECK_MORE_SUBTASKS re-lists from the start. Progress is therefore whatever the action's
 * `loadData` filter excludes, and nothing else. Two ways that stalls, both seen in production:
 *
 *  - `processData` fails permanently (a published entry is locked), so the filter keeps matching
 *    and the same batch is dispatched every round until maxIterations (500) — hours of Lambda
 *    invocations at one 120s wait per round, with the entry stuck and nothing reported.
 *  - the subtasks can't be dispatched at all, which used to be logged and dropped, leaving the
 *    parent waiting on children that were never created.
 */
import { describe, expect, it, vi } from "vitest";
import { CreateTasksByModel } from "~/features/EntriesBulkAction/internals/CreateTasksByModel.js";
import { BulkActionOperationByModelAction } from "~/types.js";

const model = { modelId: "product" } as any;

const createDeps = (overrides: { triggerFails?: boolean } = {}) => {
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), log: vi.fn(), debug: vi.fn() };

    const triggerTask = {
        execute: vi.fn(async () => {
            if (overrides.triggerFails) {
                throw new Error("Task dispatch rejected");
            }
            return { id: "child" } as any;
        })
    };

    return {
        logger,
        triggerTask,
        getModel: { execute: vi.fn(async () => ({ isFail: () => false, value: model })) }
    };
};

/** Always returns the same two entries — a filter that never excludes what was processed. */
const createStalledAction = () => ({
    name: "applyDiscount",
    loadData: vi.fn(async () => ({
        entries: [{ id: "entry-1#0001" }, { id: "entry-2#0001" }],
        meta: { totalCount: 2, hasMoreItems: false, cursor: null }
    })),
    processData: vi.fn()
});

const createController = () => ({
    runtime: { isAborted: () => false, isCloseToTimeout: () => false },
    state: { getTask: () => ({ id: "parent-task" }) },
    response: {
        error: vi.fn((message: string) => ({ status: "error", message })),
        aborted: vi.fn(() => ({ status: "aborted" })),
        continue: vi.fn((input: any) => ({ status: "continue", input }))
    }
});

const baseInput = { actionName: "applyDiscount", modelId: "product" } as any;

const run = (action: any, deps: ReturnType<typeof createDeps>, input: any) => {
    const controller = createController();
    const createTasks = new CreateTasksByModel(
        deps.getModel as any,
        deps.triggerTask as any,
        action as any,
        "hcmsBulkProcessEntries",
        100,
        deps.logger as any
    );
    return createTasks
        .execute({ input, controller } as any)
        .then(result => ({ result, controller }));
};

describe("CreateTasksByModel", () => {
    it("dispatches subtasks and reports the batch it dispatched", async () => {
        const deps = createDeps();
        const { result } = await run(createStalledAction(), deps, baseInput);

        expect(deps.triggerTask.execute).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({
            status: "continue",
            input: { action: BulkActionOperationByModelAction.PROCESS_SUBTASKS }
        });
        // The fingerprint is what the next round compares against.
        expect((result as any).input.dispatchedSignature).toBeTruthy();
    });

    it("ends the task when a round comes back with the same entries", async () => {
        const deps = createDeps();

        // Round one: dispatch, and keep the signature the engine would carry forward.
        const first = await run(createStalledAction(), deps, baseInput);
        const dispatchedSignature = (first.result as any).input.dispatchedSignature;

        // Round two: same entries returned, because processData never excluded them.
        const second = await run(createStalledAction(), deps, {
            ...baseInput,
            dispatchedSignature
        });

        expect(second.result).toMatchObject({ status: "error" });
        expect((second.result as any).message).toMatch(/not converging/);
        // Crucially, it did NOT dispatch the same batch a second time.
        expect(deps.triggerTask.execute).toHaveBeenCalledTimes(1);
    });

    it("ends the task when no subtask could be dispatched", async () => {
        const deps = createDeps({ triggerFails: true });
        const { result } = await run(createStalledAction(), deps, baseInput);

        expect(result).toMatchObject({ status: "error" });
        expect((result as any).message).toMatch(/could not dispatch/);
    });

    it("logs each dispatch failure instead of dropping it", async () => {
        const deps = createDeps({ triggerFails: true });
        await run(createStalledAction(), deps, baseInput);

        expect(deps.logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ actionName: "applyDiscount", modelId: "product" }),
            expect.stringContaining("Failed to trigger")
        );
    });
});
