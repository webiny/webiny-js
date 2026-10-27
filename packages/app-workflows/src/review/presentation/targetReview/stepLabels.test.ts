import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getDisplayStep } from "./getDisplayStep.js";
import { getRejectionText } from "./getRejectionText.js";
import { getReviewKind } from "./getReviewKind.js";
import { getReviewProgress } from "./getReviewProgress.js";
import { getReviewStateTag } from "./getReviewStateTag.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getStepStateTag } from "./getStepStateTag.js";
import { getTargetIdFromRevisionId } from "./getTargetIdFromRevisionId.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

describe("getStepOwnerLabel", () => {
    it("names a user", () => {
        const step = createStep({ owner: createActor({ displayName: "Luka Perić" }) });
        expect(getStepOwnerLabel(step)).toBe("Luka Perić");
    });

    it("names a user with a blank name 'A user'", () => {
        const step = createStep({ owner: createActor({ displayName: "  " }) });
        expect(getStepOwnerLabel(step)).toBe("A user");
    });

    it("names an AI or automation owner by the step title (QBZ-79)", () => {
        const ai = createStep({
            title: "AI tone check",
            owner: createActor({ type: "ai", displayName: "gpt-model-9" })
        });
        const automation = createStep({
            title: "Notify web team",
            owner: createActor({ type: "automation", displayName: "Send webhook" })
        });
        expect(getStepOwnerLabel(ai)).toBe("AI tone check");
        expect(getStepOwnerLabel(automation)).toBe("Notify web team");
    });

    it("names the team pool with the candidate team names (R232)", () => {
        const step = createStep({
            state: StepState.Awaiting,
            candidateTeams: [
                { id: "t1", name: "Marketing" },
                { id: "t2", name: "Legal" }
            ]
        });
        expect(getStepOwnerLabel(step)).toBe("Team pool (Marketing, Legal)");
    });

    it("names the team pool without a team name when none resolved", () => {
        const step = createStep({ state: StepState.Awaiting });
        expect(getStepOwnerLabel(step)).toBe("Team pool");
    });

    it("says a pending step is not reached yet", () => {
        const step = createStep({ state: StepState.Pending });
        expect(getStepOwnerLabel(step)).toBe("Not reached yet");
    });
});

describe("getRejectionText", () => {
    it("quotes the comment", () => {
        const step = createStep({ title: "Legal sign-off", comment: "Missing the disclaimer." });
        expect(getRejectionText(step)).toBe(
            "Rejected at Legal sign-off: “Missing the disclaimer.”"
        );
    });

    it("omits the colon part without a comment and never says 'by'", () => {
        const none = createStep({ title: "Legal sign-off", comment: null });
        const blank = createStep({ title: "Legal sign-off", comment: "   " });
        expect(getRejectionText(none)).toBe("Rejected at Legal sign-off.");
        expect(getRejectionText(blank)).toBe("Rejected at Legal sign-off.");
    });

    it("cuts a long comment at 80 characters (QBZ-64)", () => {
        const comment = "x".repeat(100);
        const step = createStep({ title: "Legal", comment });
        expect(getRejectionText(step)).toBe(`Rejected at Legal: “${"x".repeat(80)}…”`);
    });

    it("keeps a comment of exactly 80 characters whole", () => {
        const comment = "y".repeat(80);
        const step = createStep({ title: "Legal", comment });
        expect(getRejectionText(step)).toBe(`Rejected at Legal: “${comment}”`);
    });
});

const ALL_STEP_STATES = [
    StepState.Pending,
    StepState.Awaiting,
    StepState.InReview,
    StepState.Approved,
    StepState.Rejected,
    StepState.Failed
];

describe("tags", () => {
    it("tags the review state (QBZ-52)", () => {
        expect(getReviewStateTag(ReviewState.InProgress)).toEqual({
            label: "Review: In progress",
            variant: "accent-light"
        });
        expect(getReviewStateTag(ReviewState.Approved)).toEqual({
            label: "Review: Approved",
            variant: "success-light"
        });
        expect(getReviewStateTag(ReviewState.Rejected)).toEqual({
            label: "Review: Rejected",
            variant: "neutral-dark"
        });
    });

    it("makes only the failed step state red, with the sync_problem icon (R239, Q24, R263)", () => {
        expect(getStepStateTag(StepState.Failed)).toEqual({
            label: "Failed",
            variant: "destructive",
            icon: "sync_problem"
        });
        expect(getStepStateTag(StepState.Rejected).variant).toBe("neutral-dark");
        const others = ALL_STEP_STATES.filter(state => state !== StepState.Failed);
        const variants = others.map(state => getStepStateTag(state).variant);
        expect(variants).not.toContain("destructive");
    });

    it("tags all six step states with distinct labels", () => {
        const labels = ALL_STEP_STATES.map(state => getStepStateTag(state).label);
        expect(labels).toEqual([
            "Pending",
            "Awaiting",
            "In review",
            "Approved",
            "Rejected",
            "Failed"
        ]);
    });

    it("gives the six step states distinct variants", () => {
        const variants = ALL_STEP_STATES.map(state => getStepStateTag(state).variant);
        expect(new Set(variants).size).toBe(6);
    });
});

describe("getReviewProgress", () => {
    it("counts approved steps and lists every step with its owner label and comment", () => {
        const review = createReview({
            steps: [
                createStep({
                    id: "a",
                    title: "Editorial",
                    state: StepState.Approved,
                    comment: "Fine.",
                    owner: createActor({ displayName: "Ivan Horvat" })
                }),
                createStep({ id: "b", title: "Legal", state: StepState.Awaiting }),
                createStep({ id: "c", title: "Brand", state: StepState.Pending })
            ]
        });
        expect(getReviewProgress(review)).toEqual({
            approved: 1,
            total: 3,
            segments: [
                {
                    stepId: "a",
                    title: "Editorial",
                    state: StepState.Approved,
                    ownerLabel: "Ivan Horvat",
                    comment: "Fine.",
                    tag: { label: "Approved", variant: "success-light" },
                    message: null,
                    tooltip: null
                },
                {
                    stepId: "b",
                    title: "Legal",
                    state: StepState.Awaiting,
                    ownerLabel: "Team pool",
                    comment: null,
                    tag: { label: "Awaiting", variant: "warning" },
                    message: null,
                    tooltip: null
                },
                {
                    stepId: "c",
                    title: "Brand",
                    state: StepState.Pending,
                    ownerLabel: "Not reached yet",
                    comment: null,
                    tag: { label: "Pending", variant: "neutral-base-outline" },
                    message: null,
                    tooltip: null
                }
            ]
        });
    });
});

describe("getDisplayStep", () => {
    it("describes the current step", () => {
        const review = createReview({
            currentStepId: "b",
            steps: [createStep({ id: "a" }), createStep({ id: "b" }), createStep({ id: "c" })]
        });
        const display = getDisplayStep(review);
        expect(display?.step.id).toBe("b");
        expect(display?.index).toBe(1);
        expect(display?.total).toBe(3);
    });

    it("describes the rejecting step of a rejected review without a current step", () => {
        const review = createReview({
            state: ReviewState.Rejected,
            currentStepId: null,
            steps: [
                createStep({ id: "a", state: StepState.Approved }),
                createStep({ id: "b", state: StepState.Rejected }),
                createStep({ id: "c", state: StepState.Pending })
            ]
        });
        expect(getDisplayStep(review)?.step.id).toBe("b");
    });

    it("describes the last step of an approved review", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            steps: [
                createStep({ id: "a", state: StepState.Approved }),
                createStep({ id: "b", state: StepState.Approved })
            ]
        });
        expect(getDisplayStep(review)?.step.id).toBe("b");
    });

    it("returns null for a review without steps", () => {
        const review = createReview({ steps: [], currentStepId: null });
        expect(getDisplayStep(review)).toBeNull();
    });
});

describe("getReviewKind", () => {
    it("is none unless the status is active", () => {
        const review = createReview({ state: ReviewState.Approved });
        expect(getReviewKind("none", review)).toBe("none");
        expect(getReviewKind("noWorkflow", null)).toBe("none");
        expect(getReviewKind("loading", null)).toBe("none");
        expect(getReviewKind("failed", null)).toBe("none");
        expect(getReviewKind("active", null)).toBe("none");
    });

    it("maps the review state and reads a cancelled review as none (D75)", () => {
        const inProgress = createReview({ state: ReviewState.InProgress });
        const approved = createReview({ state: ReviewState.Approved });
        const rejected = createReview({ state: ReviewState.Rejected });
        const cancelled = createReview({ state: ReviewState.Cancelled });
        expect(getReviewKind("active", inProgress)).toBe("inProgress");
        expect(getReviewKind("active", approved)).toBe("approved");
        expect(getReviewKind("active", rejected)).toBe("rejected");
        expect(getReviewKind("active", cancelled)).toBe("none");
    });
});

describe("getTargetIdFromRevisionId", () => {
    it("returns the part before the version", () => {
        expect(getTargetIdFromRevisionId("entry-1#0003")).toBe("entry-1");
    });

    it("returns an id without a version unchanged", () => {
        expect(getTargetIdFromRevisionId("entry-1")).toBe("entry-1");
    });
});
