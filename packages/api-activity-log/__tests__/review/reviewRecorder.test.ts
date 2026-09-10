import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import {
    ActivityWriter,
    type IRecordReviewActivityParams,
    type IWriteActivityParams,
    ReviewActivityRecorder
} from "~/cms/recorder/abstractions.js";
import { ReviewActivityRecorder as ReviewActivityRecorderImpl } from "~/cms/review/ReviewActivityRecorder.js";
import { WorkflowStateApproveStepHandler } from "@webiny/api-workflows/features/workflowState/ApproveWorkflowStateStep/events.js";
import { WorkflowStateRejectHandler } from "@webiny/api-workflows/features/workflowState/RejectWorkflowStateStep/events.js";
import { RecordReviewStepApproved } from "~/cms/review/RecordReviewStepApproved.js";
import { RecordReviewStepRejected } from "~/cms/review/RecordReviewStepRejected.js";

const state = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "ws-1",
        app: "cms.article",
        targetId: "abc",
        targetRevisionId: "abc#0003",
        state: "pending",
        steps: [
            { id: "s1", title: "Editorial", state: "approved", comment: "looks good" },
            { id: "s2", title: "Legal", state: "inReview" }
        ],
        ...overrides
    }) as never;

const harness = (writeImpl: (params: IWriteActivityParams) => unknown = async () => undefined) => {
    const container = new Container();
    const write = vi.fn(writeImpl);

    container.registerInstance(ActivityWriter, { write } as unknown as ActivityWriter.Interface);
    container.register(ReviewActivityRecorderImpl);

    return { container, write, recorder: container.resolve(ReviewActivityRecorder) };
};

describe("ReviewActivityRecorder", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(console, "info").mockImplementation(() => undefined);
    });

    it("records against the entry, using the revision from the workflow state", () => {
        // targetRevisionId populates the record's revision so a review transition groups with the
        // saves it relates to, rather than floating free of them.
        const { recorder, write } = harness();

        return recorder.record({ state: state(), action: "review.step.approved" }).then(() => {
            expect(write.mock.calls[0]![0]).toMatchObject({
                targetId: "abc",
                revision: "abc#0003",
                action: "review.step.approved"
            });
        });
    });

    it("names the step that was approved", async () => {
        const { recorder, write } = harness();

        await recorder.record({ state: state(), action: "review.step.approved" });

        expect(write.mock.calls[0]![0].subject).toEqual({ id: "s1", label: "Editorial" });
    });

    it("records that a note was attached, never the note itself", async () => {
        const { recorder, write } = harness();

        await recorder.record({ state: state(), action: "review.step.approved" });

        const written = JSON.stringify(write.mock.calls[0]![0]);

        expect(write.mock.calls[0]![0].hasNote).toBe(true);
        expect(written).not.toContain("looks good");
    });

    it("records the absence of a note", async () => {
        const { recorder, write } = harness();

        await recorder.record({
            state: state({
                steps: [{ id: "s1", title: "Editorial", state: "approved" }]
            }),
            action: "review.step.approved"
        });

        expect(write.mock.calls[0]![0].hasNote).toBe(false);
    });

    it("carries no subject for an action about the whole review", async () => {
        const { recorder, write } = harness();

        await recorder.record({ state: state(), action: "review.submitted" });

        expect(write.mock.calls[0]![0].subject).toBeUndefined();
    });

    describe("non-CMS targets", () => {
        it("skips a Website Builder target rather than recording it", async () => {
            const { recorder, write } = harness();

            await recorder.record({
                state: state({ app: "websiteBuilder" }),
                action: "review.step.approved"
            });

            expect(write).not.toHaveBeenCalled();
        });

        it("says so rather than dropping it silently", async () => {
            // Out of scope for this checkpoint is a decision; a gap that looks like capture never
            // firing is a bug report waiting to happen.
            const { recorder } = harness();

            await recorder.record({
                state: state({ app: "websiteBuilder" }),
                action: "review.step.approved"
            });

            expect(console.info).toHaveBeenCalled();
            expect(vi.mocked(console.info).mock.calls[0]![0]).toContain("out of scope");
        });
    });

    describe("failure containment", () => {
        it("resolves when the writer throws", async () => {
            const { recorder } = harness(() => {
                throw new Error("boom");
            });

            await expect(
                recorder.record({ state: state(), action: "review.step.approved" })
            ).resolves.toBeUndefined();
        });

        it("resolves when the state is malformed", async () => {
            const { recorder } = harness();

            await expect(
                recorder.record({ state: undefined as never, action: "review.submitted" })
            ).resolves.toBeUndefined();
        });
    });
});

describe("terminal record state pairing", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    const handlerHarness = (impl: unknown, abstraction: unknown) => {
        const container = new Container();
        const record = vi.fn(async (_params: IRecordReviewActivityParams) => undefined);

        container.registerInstance(ReviewActivityRecorder, {
            record
        } as unknown as ReviewActivityRecorder.Interface);
        container.register(impl as never);

        return { record, handler: container.resolveAll(abstraction as never)[0] as never };
    };

    it("writes one record for a non-final approval", async () => {
        // The record-level state moves to `pending`, which merely mirrors the step. Recording it
        // would put an uninformative second row on the timeline for every approval.
        const { record, handler } = handlerHarness(
            RecordReviewStepApproved,
            WorkflowStateApproveStepHandler
        );

        await (handler as { handle: (e: unknown) => Promise<void> }).handle({
            payload: { state: state({ state: "pending" }) }
        });

        expect(record).toHaveBeenCalledTimes(1);
        expect(record.mock.calls[0]![0].action).toBe("review.step.approved");
    });

    it("writes two records for a final approval, sharing a correlation id", async () => {
        const { record, handler } = handlerHarness(
            RecordReviewStepApproved,
            WorkflowStateApproveStepHandler
        );

        await (handler as { handle: (e: unknown) => Promise<void> }).handle({
            payload: { state: state({ state: "approved" }) }
        });

        expect(record).toHaveBeenCalledTimes(2);
        expect(record.mock.calls.map(c => c[0].action)).toEqual([
            "review.step.approved",
            "review.approved"
        ]);
        expect(record.mock.calls[0]![0].correlationId).toBe(record.mock.calls[1]![0].correlationId);
    });

    it("writes two records for a rejection, which always ends the review", async () => {
        const { record, handler } = handlerHarness(
            RecordReviewStepRejected,
            WorkflowStateRejectHandler
        );

        await (handler as { handle: (e: unknown) => Promise<void> }).handle({
            payload: { state: state({ state: "rejected" }) }
        });

        expect(record.mock.calls.map(c => c[0].action)).toEqual([
            "review.step.rejected",
            "review.rejected"
        ]);
    });

    it("does not assume a rejection is terminal, but reads the record state", async () => {
        // Guards against a future APW change that lets a rejected step be reopened.
        const { record, handler } = handlerHarness(
            RecordReviewStepRejected,
            WorkflowStateRejectHandler
        );

        await (handler as { handle: (e: unknown) => Promise<void> }).handle({
            payload: { state: state({ state: "pending" }) }
        });

        expect(record).toHaveBeenCalledTimes(1);
    });
});
