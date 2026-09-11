import { describe, expect, it } from "vitest";
import { hasNote, identifyStep, toSubject, type StepLike } from "~/cms/review/identifyStep.js";

const step = (id: string, state: string, comment?: string | null): StepLike => ({
    id,
    title: `Step ${id}`,
    state,
    ...(comment === undefined ? {} : { comment })
});

describe("identifyStep", () => {
    describe("approval", () => {
        it("picks the step just approved, not the first one", () => {
            // Approvals happen in order, so the newest approved step is the last one. Returning
            // the first would credit every later approval to step one.
            const steps = [step("a", "approved"), step("b", "approved"), step("c", "inReview")];

            expect(identifyStep("review.step.approved", steps)?.id).toBe("b");
        });

        it("picks the only step on a single-step workflow", () => {
            expect(identifyStep("review.step.approved", [step("a", "approved")])?.id).toBe("a");
        });

        it("picks the final step when the whole review is approved", () => {
            const steps = [step("a", "approved"), step("b", "approved")];

            expect(identifyStep("review.step.approved", steps)?.id).toBe("b");
        });

        it("returns null when nothing is approved", () => {
            expect(identifyStep("review.step.approved", [step("a", "inReview")])).toBeNull();
        });
    });

    describe("rejection", () => {
        it("picks the rejected step", () => {
            const steps = [step("a", "approved"), step("b", "rejected"), step("c", "pending")];

            expect(identifyStep("review.step.rejected", steps)?.id).toBe("b");
        });

        it("returns null when nothing is rejected", () => {
            expect(identifyStep("review.step.rejected", [step("a", "approved")])).toBeNull();
        });
    });

    describe("start and take-over", () => {
        it("picks the step in review", () => {
            const steps = [step("a", "approved"), step("b", "inReview"), step("c", "pending")];

            expect(identifyStep("review.step.started", steps)?.id).toBe("b");
            expect(identifyStep("review.step.takenOver", steps)?.id).toBe("b");
        });

        it("returns null when no step is in review", () => {
            const steps = [step("a", "approved"), step("b", "pending")];

            expect(identifyStep("review.step.started", steps)).toBeNull();
        });
    });

    describe("actions about the review as a whole", () => {
        it.each([
            "review.submitted",
            "review.cancelled",
            "review.deleted",
            "review.approved",
            "review.rejected"
        ] as const)("%s identifies no step", action => {
            const steps = [step("a", "approved"), step("b", "inReview")];

            expect(identifyStep(action, steps)).toBeNull();
        });
    });

    it("survives an empty step list", () => {
        expect(identifyStep("review.step.approved", [])).toBeNull();
    });
});

describe("toSubject", () => {
    it("captures the step's id and title", () => {
        // The title is captured now so an old record stays legible after a workflow is renamed.
        expect(toSubject({ id: "s1", title: "Legal review", state: "approved" })).toEqual({
            id: "s1",
            label: "Legal review"
        });
    });
});

describe("hasNote", () => {
    it("is true for a written note", () => {
        expect(
            hasNote(step("a", "rejected", "Needs a source for the claim in paragraph two"))
        ).toBe(true);
    });

    it("is false for an absent note", () => {
        expect(hasNote(step("a", "approved"))).toBe(false);
    });

    it("is false for null and for whitespace", () => {
        expect(hasNote(step("a", "approved", null))).toBe(false);
        expect(hasNote(step("a", "approved", ""))).toBe(false);
        expect(hasNote(step("a", "approved", "   "))).toBe(false);
    });
});
