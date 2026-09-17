import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ITaskTriggerParams } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import type { ActivityRecord, SummaryValueEntry } from "~/core/types.js";
import { ActivitySourceResolver } from "~/cms/recorder/abstractions.js";
import { SummaryModelAvailability } from "~/cms/summary/availability.js";
import { ActivitySummaryConfig, DEFAULT_ACTIVITY_SUMMARY_CONFIG } from "~/cms/summary/config.js";
import {
    SummaryDispatcher,
    SummaryDispatcherImplementation
} from "~/cms/summary/SummaryDispatcher.js";

/**
 * The debounce, which is the feature's entire cost control.
 *
 * A dispatch is three CMS operations plus a Step Functions call plus — because it is delayed — an
 * extra Lambda invocation before any work happens. An editor saving ten times in two minutes must
 * produce one of those, not ten.
 */

const field = (fieldId: string, type = "long-text"): CmsModelField =>
    ({
        id: fieldId,
        fieldId,
        type,
        label: fieldId,
        storageId: `${type}@${fieldId}`,
        validation: [],
        listValidation: []
    }) as CmsModelField;

const model = { modelId: "page", fields: [field("intro"), field("body")] } as unknown as CmsModel;

const changeset = [
    { path: "intro", label: "Intro" },
    { path: "body", label: "Body" }
];

const values = (marker: string) => ({ intro: `${marker} intro`, body: `${marker} body` });

const bundle = (paths: string[]): SummaryValueEntry[] =>
    paths.map(path => ({ path, label: path, before: "old", after: "new" }));

const pendingRecord = (overrides: Partial<ActivityRecord> = {}): ActivityRecord =>
    ({
        id: "rec-1",
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: new Date().toISOString(),
        actor: { id: "u-1", type: "admin", displayName: "Ada" },
        action: "entry.update",
        source: "admin",
        correlationId: "c1",
        changeset: [],
        truncated: false,
        summaryState: {
            values: bundle(["intro"]),
            valuesWrittenOn: new Date().toISOString()
        },
        ...overrides
    }) as ActivityRecord;

interface HarnessOptions {
    previous?: ActivityRecord | null;
    listFails?: boolean;
    withTaskService?: boolean;
    config?: Partial<typeof DEFAULT_ACTIVITY_SUMMARY_CONFIG>;
    onExtend?: () => void;
    source?: string;
}

const harness = (options: HarnessOptions = {}) => {
    const container = new Container();

    const list = vi.fn(async (_params: ActivityLogStorage.ListParams) =>
        options.listFails
            ? Result.fail(new Error("read failed") as never)
            : Result.ok({
                  records: options.previous ? [options.previous] : [],
                  cursor: null,
                  hasMore: false
              })
    );
    const extendSummaryValues = vi.fn(async (_params: ActivityLogStorage.ExtendValuesParams) => {
        options.onExtend?.();
        return Result.ok();
    });
    const trigger = vi.fn(async (_params: ITaskTriggerParams) =>
        Result.ok({ id: "task-1" } as never)
    );

    container.registerInstance(ActivityLogStorage, {
        append: vi.fn(),
        list,
        deleteAllForTarget: vi.fn(),
        settleSummary: vi.fn(),
        extendSummaryValues,
        findStaleValues: vi.fn()
    } as unknown as ActivityLogStorage.Interface);

    container.registerInstance(ActivitySourceResolver, {
        resolve: () => options.source ?? "admin"
    } as ActivitySourceResolver.Interface);

    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ id: "u-1", type: "admin", displayName: "Ada" })
    } as unknown as IdentityContext.Interface);

    container.registerInstance(SummaryModelAvailability, {
        isAvailable: () => true
    } as SummaryModelAvailability.Interface);

    container.registerInstance(ActivitySummaryConfig, {
        ...DEFAULT_ACTIVITY_SUMMARY_CONFIG,
        ...options.config
    });

    if (options.withTaskService !== false) {
        container.registerInstance(TaskService, { trigger } as unknown as TaskService.Interface);
    }

    container.register(SummaryDispatcherImplementation);

    return {
        dispatcher: container.resolve(SummaryDispatcher),
        list,
        extendSummaryValues,
        trigger
    };
};

const plan = (dispatcher: SummaryDispatcher.Interface, marker = "new") =>
    dispatcher.plan({
        model,
        targetId: "abc",
        revision: "abc#0001",
        changeset,
        before: values("old"),
        after: values(marker)
    });

beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("the lookup only happens on the dispatch path", () => {
    it("does not read when the save routes deterministic", async () => {
        // The debounce read is paid for by saves that would otherwise dispatch. A save that skips
        // must not pay for it, or the cheapest path in the feature becomes the one with an extra
        // query on it.
        const { dispatcher, list } = harness();

        await dispatcher.plan({
            model,
            targetId: "abc",
            revision: "abc#0001",
            changeset: [{ path: "intro", label: "Intro", operation: "added" }],
            before: values("old"),
            after: values("new")
        });

        expect(list).not.toHaveBeenCalled();
    });

    it("does not read when the writer is not interactive", async () => {
        // Bulk operations run as background tasks, so they carry a `task:` source. They are the
        // highest-volume writer there is and must not add a read each.
        const { dispatcher, list } = harness({ source: "task:hcmsBulkProcessEntries" });

        await plan(dispatcher);

        expect(list).not.toHaveBeenCalled();
    });

    it("reads exactly once on the dispatch path", async () => {
        const { dispatcher, list } = harness();

        await plan(dispatcher);

        expect(list).toHaveBeenCalledTimes(1);
    });
});

describe("starting a run", () => {
    it("stores the bundle and asks for a dispatch", async () => {
        const { dispatcher } = harness();

        const result = await plan(dispatcher);

        expect(result.dispatch).toBe(true);
        expect(result.state?.values).toHaveLength(2);
        expect(result.state?.valuesWrittenOn).toBeTruthy();
    });

    it("triggers the task with the record id and nothing else", async () => {
        // The payload is deliberately just an id: task input is persisted on a wbyTask entry,
        // retained unless the definition opts into cleanup, and indexed on ddb-es.
        const { dispatcher, trigger } = harness();

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-9" }));

        expect(trigger).toHaveBeenCalledTimes(1);
        expect(trigger.mock.calls[0]![0]).toMatchObject({ input: { recordId: "rec-9" } });
    });

    it("dispatches with a delay, so a run has time to accumulate", async () => {
        const { dispatcher, trigger } = harness();

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord());

        expect(trigger.mock.calls[0]![0].delay).toBe(
            DEFAULT_ACTIVITY_SUMMARY_CONFIG.dispatchDelaySeconds
        );
    });
});

describe("joining a run", () => {
    it("extends instead of dispatching", async () => {
        const { dispatcher, trigger, extendSummaryValues } = harness({
            previous: pendingRecord()
        });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        expect(extendSummaryValues).toHaveBeenCalledTimes(1);
        expect(trigger).not.toHaveBeenCalled();
    });

    it("spans the run rather than replacing it", async () => {
        const { dispatcher, extendSummaryValues } = harness({ previous: pendingRecord() });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        // The earlier record's `intro` plus this save's `body`.
        const sent = extendSummaryValues.mock.calls[0]![0].values;
        expect(sent.map(v => v.path).sort()).toEqual(["body", "intro"]);
    });

    it("stores no values of its own on the joining record", async () => {
        // One bundle per run. A second copy would be content stranded on a record no job points at.
        const { dispatcher } = harness({ previous: pendingRecord() });

        const result = await plan(dispatcher);

        expect(result.state?.values).toBeUndefined();
        expect(result.state?.reason).toBe("covered-by-run");
    });
});

describe("when a run must not be joined", () => {
    it("starts fresh when the previous record has already settled", async () => {
        // The decision the dispatcher must make itself. Relying on the storage refusal would leave
        // this save uncovered with nothing recording why.
        const { dispatcher, trigger } = harness({
            previous: pendingRecord({ summary: "Already written.", summaryState: undefined })
        });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        expect(result.dispatch).toBe(true);
        expect(trigger).toHaveBeenCalledTimes(1);
    });

    it("starts fresh when the previous record carries a reason but no values", async () => {
        const { dispatcher, trigger } = harness({
            previous: pendingRecord({ summaryState: { reason: "too-few-text-fields" } })
        });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        expect(trigger).toHaveBeenCalledTimes(1);
    });

    it("starts fresh once the window has closed", async () => {
        const stale = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { dispatcher, trigger } = harness({
            previous: pendingRecord({
                summaryState: { values: bundle(["intro"]), valuesWrittenOn: stale }
            })
        });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        expect(trigger).toHaveBeenCalledTimes(1);
    });

    it("starts fresh when extending would cross the value ceiling", async () => {
        // A long editing session produces several summaries rather than one oversized failure.
        //
        // The ceiling has to sit *between* this save's own bundle and the merged one, or the
        // routing rule rejects first and the debounce branch is never reached — which is what the
        // first version of this test did, passing while proving nothing.
        const alreadyLong = Array.from({ length: 30 }, (_, i) => `p${i}`);
        const { dispatcher, trigger, extendSummaryValues } = harness({
            previous: pendingRecord({
                summaryState: {
                    values: bundle(alreadyLong),
                    valuesWrittenOn: new Date().toISOString()
                }
            }),
            config: { maxValueBytes: 600 }
        });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        expect(extendSummaryValues).not.toHaveBeenCalled();
        expect(trigger).toHaveBeenCalledTimes(1);
    });

    it("starts fresh when the lookup fails", async () => {
        // A failed read must not silently drop the save's summary.
        const { dispatcher, trigger } = harness({ listFails: true });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        expect(trigger).toHaveBeenCalledTimes(1);
    });
});

describe("the race between the lookup and the extend", () => {
    it("leaves nothing stranded when the job settles in between", async () => {
        // The window the dispatcher cannot close: it reads a pending record, and the job settles
        // before the extend lands. Storage refuses, and this save is simply not covered — the run's
        // summary describes slightly less than it might have.
        //
        // What must not happen is content left behind. The joining record carries no values of its
        // own, so a refused extend strands nothing and the sweeper has nothing to reclaim.
        let settledMidway = false;

        const { dispatcher, extendSummaryValues, trigger } = harness({
            previous: pendingRecord(),
            onExtend: () => {
                settledMidway = true;
            }
        });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        expect(extendSummaryValues).toHaveBeenCalledTimes(1);
        expect(settledMidway).toBe(true);
        // No second job for a run that already had one.
        expect(trigger).not.toHaveBeenCalled();
        // And nothing on this record for a sweeper to find.
        expect(result.state?.values).toBeUndefined();
    });
});

describe("without a task service", () => {
    it("records why rather than throwing", async () => {
        // A project that has not registered background tasks gets the timeline and no sentences.
        const { dispatcher, list } = harness({ withTaskService: false });

        const result = await plan(dispatcher);

        expect(result.state?.reason).toBe("ai-unavailable");
        expect(result.dispatch).toBeUndefined();
        // And it did not pay for the lookup either.
        expect(list).not.toHaveBeenCalled();
    });
});
