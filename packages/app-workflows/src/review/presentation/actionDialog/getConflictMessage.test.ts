import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getConflictMessage } from "./getConflictMessage.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const NOW = new Date(2026, 9, 16, 15, 0);
const WHEN = new Date(2026, 9, 16, 10, 51).toISOString();
const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

const review = (stepOverrides = {}, reviewOverrides = {}) => {
    return createReview({
        lastChangedOn: WHEN,
        currentStepId: "step-1",
        steps: [createStep({ title: "Legal sign-off", ...stepOverrides })],
        ...reviewOverrides
    });
};

describe("getConflictMessage (QBZ-2)", () => {
    it("always uses the title 'Someone else acted first'", () => {
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review(),
            now: NOW,
            listRefreshed: false
        });
        expect(result.title).toBe("Someone else acted first");
    });

    it("names who took the step over", () => {
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review({
                state: StepState.InReview,
                owner: LUKA,
                assignment: { source: "takeOver", ruleId: null, reason: null, by: LUKA }
            }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Luka Perić took over “Legal sign-off” at 10:51, so your approval was not saved."
        );
    });

    it("tells that someone started the step from the pool first", () => {
        const result = getConflictMessage({
            kind: "start",
            stepId: "step-1",
            review: review({ state: StepState.InReview, owner: LUKA }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Luka Perić started “Legal sign-off” at 10:51. You can still take it over."
        );
    });

    it("adds 'The list has been refreshed.' to the started-first message for Content Reviews (QBZ-31)", () => {
        const result = getConflictMessage({
            kind: "start",
            stepId: "step-1",
            review: review({ state: StepState.InReview, owner: LUKA }),
            now: NOW,
            listRefreshed: true
        });
        expect(result.message).toBe(
            "Luka Perić started “Legal sign-off” at 10:51. You can still take it over. The list has been refreshed."
        );
    });

    it.each(["start", "takeOver", "reassign", "approve", "reject", "cancel"] as const)(
        "ends a %s conflict with 'The list has been refreshed.' when Content Reviews refreshed (R220)",
        kind => {
            const result = getConflictMessage({
                kind,
                stepId: "step-1",
                review: review({ state: StepState.Approved, owner: LUKA }),
                now: NOW,
                listRefreshed: true
            });
            expect(result.message.endsWith(" The list has been refreshed.")).toBe(true);
        }
    );

    it("ends the generic text with the list note too, and never without listRefreshed", () => {
        const refreshed = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: null,
            now: NOW,
            listRefreshed: true
        });
        const plain = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: null,
            now: NOW,
            listRefreshed: false
        });
        expect(refreshed.message).toBe(`${plain.message} The list has been refreshed.`);
        expect(plain.message).not.toContain("refreshed");
    });

    it("tells that the step was approved first", () => {
        const result = getConflictMessage({
            kind: "reject",
            stepId: "step-1",
            review: review({ state: StepState.Approved, owner: LUKA }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Luka Perić approved “Legal sign-off” at 10:51, so your rejection was not saved. The review moved on to the next step."
        );
    });

    it("tells that the step was rejected first", () => {
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review({ state: StepState.Rejected, owner: LUKA }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Luka Perić rejected “Legal sign-off” at 10:51, so your approval was not saved. This revision is now rejected."
        );
    });

    it("names the operator and the new owner of a reassigned step", () => {
        const operator = createActor({ id: "user-3", displayName: "Jana Dolenc" });
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review({
                state: StepState.InReview,
                owner: LUKA,
                assignment: { source: "reassign", ruleId: null, reason: null, by: operator }
            }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Jana Dolenc reassigned “Legal sign-off” to Luka Perić at 10:51, so your approval was not saved."
        );
    });

    it("tells that the review was cancelled", () => {
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review({}, { state: ReviewState.Cancelled, isActive: false }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Someone cancelled this review at 10:51, so your approval was not saved. The revision has no review now."
        );
    });

    it("falls back to a generic text without a fresh review", () => {
        const result = getConflictMessage({
            kind: "cancel",
            stepId: null,
            review: null,
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Someone else changed this review, so your cancellation was not saved."
        );
    });

    describe("restart", () => {
        const AI_OWNER = createActor({ type: "ai", id: "user-1", displayName: "Maja Kos" });

        it("tells that someone restarted a step that is running again (R266)", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({
                    title: "AI tone check",
                    state: StepState.InReview,
                    owner: AI_OWNER
                }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.title).toBe("Someone else acted first");
            expect(result.message).toBe(
                "Someone restarted “AI tone check” at 10:51. It is running again, so your restart was not saved."
            );
        });

        it("says the same for a running automation", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({
                    title: "Notify web team",
                    state: StepState.InReview,
                    owner: createActor({ type: "automation" })
                }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Someone restarted “Notify web team” at 10:51. It is running again, so your restart was not saved."
            );
        });

        it("ends with the list note on Content Reviews (R220)", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({
                    title: "AI tone check",
                    state: StepState.InReview,
                    owner: AI_OWNER
                }),
                now: NOW,
                listRefreshed: true
            });

            expect(result.message).toBe(
                "Someone restarted “AI tone check” at 10:51. It is running again, so your restart was not saved. The list has been refreshed."
            );
        });

        it("does not claim a restart when the step is in review with a person", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({ state: StepState.InReview, owner: LUKA }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Someone else changed “Legal sign-off” at 10:51, so your restart was not saved."
            );
        });

        it("uses the cancelled text with the restart noun", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({}, { state: ReviewState.Cancelled, isActive: false }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Someone cancelled this review at 10:51, so your restart was not saved. The revision has no review now."
            );
        });

        it("uses the approved text with the restart noun", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({ state: StepState.Approved, owner: LUKA }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Luka Perić approved “Legal sign-off” at 10:51, so your restart was not saved. The review moved on to the next step."
            );
        });

        it("falls back to the generic text without a fresh review", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: null,
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Someone else changed this review, so your restart was not saved."
            );
        });
    });
});
