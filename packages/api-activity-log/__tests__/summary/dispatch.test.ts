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
    /** The run settled, or its record went, before the extend landed. */
    extendRefused?: boolean;
    source?: string;
    identity?: { id: string; type: string; displayName: string };
    available?: boolean;
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
        // Refuses when the test says the run settled underneath it, which is the case the caller
        // now has to handle rather than never learning about.
        return Result.ok({ extended: options.extendRefused !== true });
    });
    const trigger = vi.fn(async (_params: ITaskTriggerParams) =>
        Result.ok({ id: "task-1" } as never)
    );
    const settleSummary = vi.fn(async (_params: ActivityLogStorage.SettleSummaryParams) =>
        Result.ok()
    );

    container.registerInstance(ActivityLogStorage, {
        append: vi.fn(),
        list,
        deleteAllForTarget: vi.fn(),
        settleSummary,
        extendSummaryValues,
        findStaleValues: vi.fn()
    } as unknown as ActivityLogStorage.Interface);

    container.registerInstance(ActivitySourceResolver, {
        resolve: () => options.source ?? "admin"
    } as ActivitySourceResolver.Interface);

    container.registerInstance(IdentityContext, {
        getIdentity: () => options.identity ?? { id: "u-1", type: "admin", displayName: "Ada" }
    } as unknown as IdentityContext.Interface);

    container.registerInstance(SummaryModelAvailability, {
        isAvailable: () => options.available ?? true
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
        settleSummary,
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

describe("what a run is scoped to", () => {
    // The debounce joins saves within one run, and a run is one person's consecutive saves to one
    // revision. Both halves of that are enforced by the query rather than by a check afterwards, so
    // these assert the query — a lookup that dropped either key would find a neighbouring run and
    // merge two editing sessions, or two people, into one summary.

    it("asks only for the revision being saved", async () => {
        const { dispatcher, list } = harness({ previous: pendingRecord() });

        await dispatcher.plan({
            model,
            targetId: "abc",
            revision: "abc#0002",
            changeset,
            before: values("old"),
            after: values("new")
        });

        expect(list.mock.calls[0]![0].revision).toBe("abc#0002");
    });

    it("asks only for the acting identity", async () => {
        // Joining someone else's run would put one editor's changes inside another's summary, and
        // attribute the sentence to the wrong person on the timeline.
        const { dispatcher, list } = harness({ previous: pendingRecord() });

        await plan(dispatcher);

        expect(list.mock.calls[0]![0].actorId).toBe("u-1");
    });

    it("starts its own run when there is no identity to key on", async () => {
        // The safe direction. An unattributable save starting a run of its own costs one job; an
        // unattributable save joining whatever ran last costs correctness.
        const { dispatcher, list } = harness({
            previous: pendingRecord(),
            identity: { id: "", type: "", displayName: "" }
        });

        await plan(dispatcher);

        expect(list.mock.calls[0]![0].actorId).toBeUndefined();
    });
});

describe("run membership", () => {
    it("names the run a joining save belongs to", async () => {
        // The dispatching record's id. Grouping then reads membership rather than inferring it
        // from position, which a row holding several runs makes meaningless.
        const { dispatcher } = harness({ previous: pendingRecord() });

        const planned = await plan(dispatcher);

        expect(planned.summaryRunId).toBe("rec-1");
        expect(planned.state?.reason).toBe("covered-by-run");
    });

    it("claims no run for a save that opened one", async () => {
        // Absent means "its own run", resolved at the read boundary. A record cannot know its own
        // id at the moment it is written.
        const { dispatcher } = harness();

        expect((await plan(dispatcher)).summaryRunId).toBeUndefined();
    });
});

describe("the race between the lookup and the extend", () => {
    it("leaves nothing stranded when the job settles in between", async () => {
        // The window the dispatcher cannot close: it reads a pending record, and the job settles
        // before the extend lands.
        //
        // What must not happen is content left behind. The joining record carries no values of its
        // own, so a refused extend strands nothing and the sweeper has nothing to reclaim.
        let settledMidway = false;

        const { dispatcher, extendSummaryValues, trigger } = harness({
            previous: pendingRecord(),
            extendRefused: true,
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

    it("withdraws the claim rather than leaving a save attributed to a run that missed it", async () => {
        // The reason the refusal had to stop being silent. A save that believes it joined a run and
        // did not would put that run's sentence at the head of a group containing it — the exact
        // error the run id exists to remove, reintroduced at a smaller scale.
        const { dispatcher, settleSummary } = harness({
            previous: pendingRecord(),
            extendRefused: true
        });

        const result = await plan(dispatcher);
        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        expect(settleSummary).toHaveBeenCalledWith({
            recordId: "rec-2",
            reason: "join-refused",
            runId: null
        });
    });

    it("says the join was refused rather than borrowing a reason", async () => {
        // A save whose join was refused is a different thing from one that never qualified: it is
        // exactly the kind of save that should have had a sentence. On an instance reporting "no
        // sentences anywhere", that difference is the diagnosis.
        const { dispatcher, settleSummary } = harness({
            previous: pendingRecord(),
            extendRefused: true
        });

        await dispatcher.follow(await plan(dispatcher), pendingRecord({ id: "rec-2" }));

        expect(settleSummary.mock.calls[0]![0].reason).not.toBe("covered-by-run");
        expect(settleSummary.mock.calls[0]![0].reason).not.toBe("too-few-text-fields");
    });

    it("writes no summary, so the correction cannot put one beside a bundle", async () => {
        // `settleSummary` clears the transient values as part of storing a result, and that pairing
        // is what stops a summary ever sitting beside the values that produced it. This write
        // borrows the operation for a record that has no values — so it must not carry a summary
        // either, or the pairing would hold only by luck.
        const { dispatcher, settleSummary } = harness({
            previous: pendingRecord(),
            extendRefused: true
        });

        const result = await plan(dispatcher);
        // Asserted rather than assumed: the joining record carries nothing to clear.
        expect(result.state?.values).toBeUndefined();

        await dispatcher.follow(result, pendingRecord({ id: "rec-2" }));

        const correction = settleSummary.mock.calls[0]![0];
        expect(correction.summary).toBeUndefined();
        expect(correction.kind).toBeUndefined();
    });

    it("corrects nothing when the join was accepted", async () => {
        const { dispatcher, settleSummary } = harness({ previous: pendingRecord() });

        await dispatcher.follow(await plan(dispatcher), pendingRecord({ id: "rec-2" }));

        expect(settleSummary).not.toHaveBeenCalled();
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

describe("the per-installation switch", () => {
    const off = () => harness({ config: { enabled: false } });

    it("stores no values", async () => {
        // The whole point of the switch: an installation that has turned summaries off must not
        // have content values written to its activity records at all, even briefly.
        const { dispatcher } = off();

        const planned = await plan(dispatcher);

        expect(planned.state?.values).toBeUndefined();
        expect(planned.state?.valuesWrittenOn).toBeUndefined();
    });

    it("dispatches nothing", async () => {
        const { dispatcher, trigger } = off();

        const planned = await plan(dispatcher);
        await dispatcher.follow(planned, { id: "rec-1" } as never);

        expect(planned.dispatch).toBeUndefined();
        expect(trigger).not.toHaveBeenCalled();
    });

    it("does not even read, so the switch costs one boolean per save", async () => {
        // The debounce lookup is the only read on this path and it sits behind the routing rule.
        // A switch that still paid for a read would be a switch worth not using.
        const { dispatcher, list } = off();

        await plan(dispatcher);

        expect(list).not.toHaveBeenCalled();
    });

    it("records why, so an installation with the switch off is diagnosable", async () => {
        // "No sentences anywhere" has several causes — switched off, no model configured, nothing
        // qualifying — and they are not the same problem. Leaving the reason blank makes them
        // indistinguishable from the outside.
        const { dispatcher } = off();

        expect((await plan(dispatcher)).state?.reason).toBe("disabled");
    });

    it("leaves the record itself untouched, so the timeline still reads", async () => {
        // The deterministic description is derived from the changeset at read time and owes
        // nothing to this path. Switching summaries off must cost a reader nothing else.
        const { dispatcher } = off();

        const planned = await plan(dispatcher);

        expect(planned.extend).toBeUndefined();
        expect(Object.keys(planned.state ?? {})).toEqual(["reason"]);
    });

    it("summarises when the switch is on, or none of the above means anything", async () => {
        const { dispatcher } = harness();

        expect((await plan(dispatcher)).dispatch).toBe(true);
    });
});

describe("the saves a model never sees", () => {
    /**
     * Two short `text` fields, which is the commonest save there is and the one no model improves
     * on. The suite's usual model is all `long-text`, and that always counts as prose whatever its
     * length — so reusing it here would have routed to the model and proved the opposite.
     */
    const shortModel = {
        modelId: "page",
        fields: [field("intro", "text"), field("body", "text")]
    } as unknown as CmsModel;

    const shortSave = (dispatcher: SummaryDispatcher.Interface) =>
        dispatcher.plan({
            model: shortModel,
            targetId: "abc",
            revision: "abc#0001",
            changeset,
            before: { intro: "Starter", body: "Draft" },
            after: { intro: "Essential", body: "Final" }
        });

    it("describes them from the values instead of dispatching", async () => {
        const { dispatcher, trigger } = harness();

        const planned = await shortSave(dispatcher);

        expect(planned.summary).toBe(
            "Changed Intro from “Starter” to “Essential” and Body from “Draft” to “Final”."
        );
        expect(planned.summaryKind).toBe("deterministic");
        expect(planned.dispatch).toBeUndefined();
        expect(trigger).not.toHaveBeenCalled();
    });

    it("stores no values, because nothing is coming to read them", async () => {
        // The difference from the model's path, and the reason this one needs no sweeper: the
        // values are read, turned into a sentence and dropped inside the write.
        const { dispatcher } = harness();

        const planned = await shortSave(dispatcher);

        expect(planned.state?.values).toBeUndefined();
        expect(planned.state?.valuesWrittenOn).toBeUndefined();
    });

    it("records why a model was not used, even though there is a sentence", async () => {
        const { dispatcher } = harness();

        expect((await shortSave(dispatcher)).state?.reason).toBe("too-few-text-fields");
    });

    it("does not read, because there is no run to join", async () => {
        const { dispatcher, list } = harness();

        await shortSave(dispatcher);

        expect(list).not.toHaveBeenCalled();
    });

    it("describes them when the switch is off", async () => {
        // The switch means "do not send my content to a model". Nothing leaves the installation on
        // this path, so the timeline still says what changed.
        const { dispatcher, trigger } = harness({ config: { enabled: false } });

        const planned = await shortSave(dispatcher);

        expect(planned.summary).toContain("Starter");
        expect(planned.state?.reason).toBe("disabled");
        expect(trigger).not.toHaveBeenCalled();
    });

    it("describes them when no model is configured", async () => {
        // The case an installation without AI Power-Ups is in, which is most of them.
        const { dispatcher } = harness({ available: false });

        const planned = await shortSave(dispatcher);

        expect(planned.summary).toContain("Essential");
        expect(planned.state?.reason).toBe("ai-unavailable");
    });

    it("says nothing at all for a machine write", async () => {
        // Not editorial work. The feature describes editorial work.
        const { dispatcher } = harness({ source: "api-key" });

        const planned = await shortSave(dispatcher);

        expect(planned.summary).toBeUndefined();
        expect(planned.state?.reason).toBe("not-interactive");
    });
});
