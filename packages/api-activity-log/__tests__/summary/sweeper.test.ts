import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { Constructor } from "@webiny/di";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import type { ActivityRecord } from "~/core/types.js";
import { ActivitySummaryConfig, DEFAULT_ACTIVITY_SUMMARY_CONFIG } from "~/cms/summary/config.js";
import { SweepStaleValuesTaskDefinition } from "~/cms/summary/SweepStaleValuesTaskDefinition.js";

/**
 * The sweeper, which is what actually bounds how long content values sit on a record.
 *
 * `selfCleanup` on the job is a backstop: it does not fire on a Lambda timeout and never fires for
 * a task created whose execution never starts. Both leave values behind, and neither is exotic.
 */

const staleRecord = (id: string): ActivityRecord =>
    ({
        id,
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: "2026-09-10T10:00:00.000Z",
        actor: { id: "u-1", type: "admin", displayName: "Ada" },
        action: "entry.update",
        source: "admin",
        correlationId: "c1",
        changeset: [],
        truncated: false,
        summaryState: {
            values: [{ path: "body", label: "Body", before: "a", after: "b" }],
            valuesWrittenOn: "2020-01-01T00:00:00.000Z"
        }
    }) as ActivityRecord;

interface Page {
    records: ActivityRecord[];
    cursor: string | null;
}

interface HarnessOptions {
    /** Consumed in order; the last one repeats if the sweeper keeps asking. */
    pages?: Page[];
    findFails?: boolean;
    settleFails?: boolean;
}

/** The end of the data: nothing here, and nowhere left to go. */
const END: Page = { records: [], cursor: null };

const harness = (options: HarnessOptions = {}) => {
    const container = new Container();
    const pages = options.pages ?? [END];
    let call = 0;

    const findStaleValues = vi.fn(async (_p: ActivityLogStorage.StaleValuesParams) => {
        if (options.findFails) {
            return Result.fail(new Error("read failed") as never);
        }
        const page = pages[Math.min(call, pages.length - 1)]!;
        call++;
        return Result.ok(page);
    });

    const settleSummary = vi.fn(async (_p: ActivityLogStorage.SettleSummaryParams) =>
        options.settleFails ? Result.fail(new Error("write failed") as never) : Result.ok()
    );

    container.registerInstance(ActivityLogStorage, {
        append: vi.fn(),
        list: vi.fn(),
        deleteAllForTarget: vi.fn(),
        settleSummary,
        extendSummaryValues: vi.fn(),
        findStaleValues
    } as unknown as ActivityLogStorage.Interface);

    container.registerInstance(ActivitySummaryConfig, DEFAULT_ACTIVITY_SUMMARY_CONFIG);
    container.register(SweepStaleValuesTaskDefinition);

    const definition = container.resolve(TaskDefinition);
    const handlerClass = definition.handler as Constructor<TaskHandler.Interface<never, never>>;

    return {
        handler: container.resolveImplementation(handlerClass),
        findStaleValues,
        settleSummary
    };
};

const controller = (options: { timeoutAfter?: number } = {}) => {
    let checks = 0;
    const calls = {
        done: vi.fn((message?: string, output?: unknown) => ({ kind: "done", message, output })),
        continue: vi.fn((input: unknown) => ({ kind: "continue", input })),
        error: vi.fn((error: unknown) => ({ kind: "error", error })),
        aborted: vi.fn(() => ({ kind: "aborted" }))
    };

    return {
        calls,
        controller: {
            runtime: {
                isAborted: () => false,
                isCloseToTimeout: () => {
                    checks++;
                    return options.timeoutAfter !== undefined && checks > options.timeoutAfter;
                }
            },
            response: calls
        } as never
    };
};

const run = (handler: TaskHandler.Interface, ctrl: never, input: unknown = {}) =>
    handler.run({ input, controller: ctrl } as never);

describe("clearing", () => {
    it("records abandoned rather than leaving the reason blank", async () => {
        // The distinction that matters on a customer instance: jobs silently never running must
        // not look identical to nothing ever qualifying for a summary.
        const { handler, settleSummary } = harness({
            pages: [{ records: [staleRecord("r1")], cursor: "c1" }, END]
        });
        const { controller: ctrl } = controller();

        await run(handler, ctrl);

        expect(settleSummary).toHaveBeenCalledWith({ recordId: "r1", reason: "abandoned" });
    });

    it("never stores a summary", async () => {
        const { handler, settleSummary } = harness({
            pages: [{ records: [staleRecord("r1")], cursor: "c1" }, END]
        });
        const { controller: ctrl } = controller();

        await run(handler, ctrl);

        expect(settleSummary.mock.calls[0]![0].summary).toBeUndefined();
    });

    it("clears across several pages and counts the whole sweep", async () => {
        const { handler } = harness({
            pages: [
                { records: [staleRecord("r1"), staleRecord("r2")], cursor: "c1" },
                { records: [staleRecord("r3")], cursor: "c2" },
                END
            ]
        });
        const { controller: ctrl, calls } = controller();

        await run(handler, ctrl);

        expect(calls.done.mock.calls[0]![1]).toMatchObject({ cleared: 3 });
    });

    it("clears the last batch before calling the sweep done", async () => {
        // The end of the data arriving together with records to clear. Treating the null cursor as
        // "stop now" would drop the final batch on every sweep.
        const { handler, settleSummary } = harness({
            pages: [{ records: [staleRecord("r1")], cursor: null }]
        });
        const { controller: ctrl, calls } = controller();

        await run(handler, ctrl);

        expect(settleSummary).toHaveBeenCalledWith({ recordId: "r1", reason: "abandoned" });
        expect(calls.done.mock.calls[0]![1]).toMatchObject({ cleared: 1 });
    });
});

describe("walking the whole model", () => {
    it("finishes only when the cursor runs out, not when a page comes back empty", async () => {
        // An empty page means "nothing this far in", which is not the same as "nothing left". A
        // sweep that stopped there would leave everything past that point untouched forever.
        const { handler, findStaleValues } = harness({
            pages: [
                { records: [], cursor: "c1" },
                { records: [], cursor: "c2" },
                { records: [staleRecord("r1")], cursor: "c3" },
                END
            ]
        });
        const { controller: ctrl, calls } = controller();

        await run(handler, ctrl);

        expect(findStaleValues).toHaveBeenCalledTimes(4);
        expect(calls.done.mock.calls[0]![1]).toMatchObject({ cleared: 1 });
    });

    it("carries the cursor forward rather than asking from the start each time", async () => {
        const { handler, findStaleValues } = harness({
            pages: [{ records: [], cursor: "c1" }, END]
        });
        const { controller: ctrl } = controller();

        await run(handler, ctrl);

        expect(findStaleValues.mock.calls[0]![0].after).toBeNull();
        expect(findStaleValues.mock.calls[1]![0].after).toBe("c1");
    });

    it("resumes where the previous run stopped", async () => {
        const { handler, findStaleValues } = harness({ pages: [END] });
        const { controller: ctrl } = controller();

        await run(handler, ctrl, { scanFrom: "somewhere" });

        expect(findStaleValues.mock.calls[0]![0].after).toBe("somewhere");
    });

    it("hands the cursor and the running total to its continuation", async () => {
        // Out of time, not out of work. Losing either would make the next run redo the first pages.
        const { handler } = harness({
            pages: [{ records: [staleRecord("r1")], cursor: "c1" }]
        });
        const { controller: ctrl, calls } = controller({ timeoutAfter: 1 });

        await run(handler, ctrl, { clearedSoFar: 10 });

        expect(calls.continue.mock.calls[0]![0]).toMatchObject({
            clearedSoFar: 11,
            scanFrom: "c1"
        });
    });
});

describe("stall detection", () => {
    it("stops rather than spinning when records qualify but none clear", async () => {
        // The defect EmptyTrashBinTask has: a persistently failing write makes it reread the same
        // batch until the timeout check breaks it, every iteration, reporting nothing.
        const { handler, findStaleValues } = harness({
            pages: [{ records: [staleRecord("r1")], cursor: "c1" }],
            settleFails: true
        });
        const { controller: ctrl, calls } = controller();

        await run(handler, ctrl);

        expect(calls.error).toHaveBeenCalled();
        expect(calls.error.mock.calls[0]![0].message).toContain("Stalled");
        // One read, not a loop — and no second page, because advancing the cursor past records it
        // could not clear would report success having quietly left content values behind.
        expect(findStaleValues).toHaveBeenCalledTimes(1);
        expect(calls.done).not.toHaveBeenCalled();
        expect(calls.continue).not.toHaveBeenCalled();
    });

    it("reports a failed read rather than treating it as an empty sweep", async () => {
        const { handler } = harness({ findFails: true });
        const { controller: ctrl, calls } = controller();

        await run(handler, ctrl);

        expect(calls.error).toHaveBeenCalled();
        expect(calls.done).not.toHaveBeenCalled();
    });
});

describe("the threshold", () => {
    it("asks for values older than the configured age", async () => {
        const { handler, findStaleValues } = harness({ pages: [END] });
        const { controller: ctrl } = controller();

        const before = Date.now();
        await run(handler, ctrl);

        const asked = new Date(findStaleValues.mock.calls[0]![0].writtenBefore).getTime();
        const expected = before - DEFAULT_ACTIVITY_SUMMARY_CONFIG.sweepThresholdMs;

        // Within a second of the configured threshold behind now.
        expect(Math.abs(asked - expected)).toBeLessThan(1000);
    });

    it("is comfortably longer than a job can live", async () => {
        // Derived rather than picked: the dispatch delay plus one run of the background-task
        // Lambda, whose timeout is 900 seconds. The job has maxIterations 1, so no continuations.
        const worstCaseMs =
            DEFAULT_ACTIVITY_SUMMARY_CONFIG.dispatchDelaySeconds * 1000 + 900 * 1000;

        expect(DEFAULT_ACTIVITY_SUMMARY_CONFIG.sweepThresholdMs).toBeGreaterThan(worstCaseMs * 3);
    });
});

describe("the definition", () => {
    it("is bounded, private and self-cleaning", async () => {
        const container = new Container();
        container.register(SweepStaleValuesTaskDefinition);

        expect(container.resolve(TaskDefinition)).toMatchObject({
            id: "activityLogSweepStaleValues",
            isPrivate: true,
            databaseLogs: false,
            selfCleanup: "always"
        });
        // It continues, so it needs room to.
        expect(container.resolve(TaskDefinition).maxIterations).toBeGreaterThan(1);
    });
});
