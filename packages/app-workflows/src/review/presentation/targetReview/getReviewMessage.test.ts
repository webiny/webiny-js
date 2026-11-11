import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getReviewMessage } from "./getReviewMessage.js";
import type { ReviewMessageParams } from "./getReviewMessage.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { at } from "~/review/testing/at.js";
import { createFailedAutomationStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAutomationStep } from "~/review/testing/createAutomatedStep.js";

const LOCK_IN_REVIEW =
    "Editing, publishing and moving are locked while this revision is in review.";
const LOCK_APPROVED =
    "Editing is locked. To make changes, create a new revision; it needs a new review.";
const LOCK_REJECTED =
    "This revision is locked for good. Create a new revision to fix it, then request a new review.";

const params = (overrides: Partial<ReviewMessageParams> = {}): ReviewMessageParams => {
    return {
        status: "active",
        failureKind: null,
        review: null,
        flags: null,
        isPublished: false,
        isUnpublished: false,
        viewerTeamIds: [],
        ...overrides
    };
};

const inReview = (owner = createActor({ id: "user-2", displayName: "Luka Perić" })) => {
    return createReview({
        currentStepId: "step-2",
        currentStepState: StepState.InReview,
        currentOwnerId: owner.id,
        steps: [
            createStep({ id: "step-1", title: "Editorial check", state: StepState.Approved }),
            createStep({
                id: "step-2",
                title: "Legal sign-off",
                state: StepState.InReview,
                owner
            })
        ]
    });
};

describe("getReviewMessage", () => {
    it("explains the loading state", () => {
        expect(getReviewMessage(params({ status: "loading" }))).toEqual({
            message: "Loading review status…",
            lockText: null
        });
    });

    it("explains a failed load", () => {
        expect(getReviewMessage(params({ status: "failed", failureKind: "error" }))).toEqual({
            message: "Could not load the review status",
            lockText: "Editing and publishing are unavailable until it loads."
        });
    });

    it("explains a read without access and hides the lock text", () => {
        expect(getReviewMessage(params({ status: "failed", failureKind: "noAccess" }))).toEqual({
            message:
                "You don't have access to this content or its review. Ask an administrator if you need it.",
            lockText: null
        });
    });

    it("has no text without a workflow", () => {
        expect(getReviewMessage(params({ status: "noWorkflow" }))).toEqual({
            message: "",
            lockText: null
        });
    });

    it("asks for a review when there is none", () => {
        expect(getReviewMessage(params({ status: "none" }))).toEqual({
            message: "This content needs review before publishing",
            lockText: "Publishing needs an approved review."
        });
    });

    it("explains a revision published before the workflow existed", () => {
        expect(getReviewMessage(params({ status: "none", isPublished: true }))).toEqual({
            message: "This content needs review before publishing (applies to new revisions)",
            lockText:
                "This revision was published before the workflow existed. Create a new revision to change it."
        });
    });

    it("names the team pools of a step that waits for someone to start it", () => {
        const review = createReview({
            currentStepState: StepState.Awaiting,
            steps: [
                createStep({
                    state: StepState.Awaiting,
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Compliance" }
                    ]
                })
            ]
        });
        expect(getReviewMessage(params({ review, flags: createFlags() }))).toEqual({
            message: "Waiting in the Marketing, Compliance team pool",
            lockText: LOCK_IN_REVIEW
        });
    });

    it("names the viewer's own teams among the step's teams joined with 'and' (QBZ-25, R232)", () => {
        const review = createReview({
            currentStepState: StepState.Awaiting,
            steps: [
                createStep({
                    state: StepState.Awaiting,
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Legal" },
                        { id: "t3", name: "Compliance" }
                    ]
                })
            ]
        });
        const result = getReviewMessage(
            params({ review, flags: createFlags(), viewerTeamIds: ["t1", "t3"] })
        );
        expect(result.message).toBe("Waiting in the Marketing and Compliance team pool");
    });

    it("names all the step's teams for a viewer outside them", () => {
        const review = createReview({
            currentStepState: StepState.Awaiting,
            steps: [
                createStep({
                    state: StepState.Awaiting,
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Legal" }
                    ]
                })
            ]
        });
        const result = getReviewMessage(
            params({ review, flags: createFlags(), viewerTeamIds: ["other"] })
        );
        expect(result.message).toBe("Waiting in the Marketing, Legal team pool");
    });

    it("does not invent a team name when none resolved", () => {
        const review = createReview();
        const result = getReviewMessage(params({ review, flags: createFlags() }));
        expect(result.message).toBe("Waiting in the team pool");
    });

    it("tells the owner that they are reviewing", () => {
        const flags = createFlags({ canApprove: true, canReject: true });
        const message = getReviewMessage(params({ review: inReview(), flags }));
        expect(message).toEqual({
            message: "You are reviewing this step",
            lockText: LOCK_IN_REVIEW
        });
    });

    it("names someone else who is reviewing", () => {
        const message = getReviewMessage(params({ review: inReview(), flags: createFlags() }));
        expect(message.message).toBe("Luka Perić is reviewing");
    });

    it("reads '{Step} failed.' for a failed step without a reason (R263, R264)", () => {
        const owner = createActor({ type: "automation", displayName: "Send webhook" });
        const review = createReview({
            currentStepId: "step-1",
            currentStepState: StepState.Failed,
            steps: [createStep({ title: "Notify web team", state: StepState.Failed, owner })]
        });
        const result = getReviewMessage(params({ review, flags: createFlags() }));
        expect(result).toEqual({ message: "Notify web team failed.", lockText: LOCK_IN_REVIEW });
    });

    it("reads approved and published", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            currentStepState: null,
            steps: [createStep({ state: StepState.Approved })]
        });
        expect(getReviewMessage(params({ review, isPublished: true }))).toEqual({
            message: "Approved and published",
            lockText: LOCK_APPROVED
        });
    });

    it("reads approved and unpublished only for a revision that was published before (R-h)", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            currentStepState: null,
            steps: [createStep({ state: StepState.Approved })]
        });
        const result = getReviewMessage(
            params({ review, isPublished: false, isUnpublished: true })
        );
        expect(result).toEqual({
            message: "Approved and unpublished. Publishing again needs no new review.",
            lockText: LOCK_APPROVED
        });
    });

    it("reads approved, ready to publish for a revision that was never published", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            currentStepState: null,
            steps: [createStep({ state: StepState.Approved })]
        });
        expect(getReviewMessage(params({ review }))).toEqual({
            message: "Approved, ready to publish",
            lockText: LOCK_APPROVED
        });
    });

    it("reads a rejection with the comment", () => {
        const review = createReview({
            state: ReviewState.Rejected,
            currentStepId: "step-1",
            currentStepState: StepState.Rejected,
            steps: [
                createStep({
                    title: "Legal sign-off",
                    state: StepState.Rejected,
                    owner: createActor({ id: "user-2", displayName: "Ana Legal" }),
                    comment: "Missing the disclaimer."
                })
            ]
        });
        expect(getReviewMessage(params({ review }))).toEqual({
            message: "Rejected at Legal sign-off: “Missing the disclaimer.”",
            lockText: LOCK_REJECTED
        });
    });

    it("reads a rejection without a comment", () => {
        const review = createReview({
            state: ReviewState.Rejected,
            currentStepId: "step-1",
            currentStepState: StepState.Rejected,
            steps: [
                createStep({
                    title: "AI tone check",
                    state: StepState.Rejected,
                    owner: createActor({ type: "ai", displayName: "gpt-model-9" })
                })
            ]
        });
        expect(getReviewMessage(params({ review })).message).toBe("Rejected at AI tone check.");
    });
});

describe("getReviewMessage, running and failed steps (R263)", () => {
    const reviewWith = (step: ReturnType<typeof createStep>) => {
        return createReview({
            currentStepId: step.id,
            currentStepState: step.state,
            steps: [step]
        });
    };

    it("reads '{Step} running since {hh:mm}' for a running AI step and keeps the lock text", () => {
        const review = reviewWith(createRunningAiStep());

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result).toEqual({
            message: "AI tone check running since 14:20",
            lockText: LOCK_IN_REVIEW
        });
    });

    it("reads the same for a running automation step", () => {
        const review = reviewWith(createRunningAutomationStep({ startedOn: at(9, 5) }));

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result.message).toBe("Notify web team running since 09:05");
    });

    it("keeps the running message even when the viewer flags allow an approval", () => {
        const review = reviewWith(createRunningAiStep());
        const flags = createFlags({ canApprove: true });

        const result = getReviewMessage(params({ review, flags }));

        expect(result.message).toBe("AI tone check running since 14:20");
    });

    it("falls back to '{Step} is reviewing' for a running step without a start time", () => {
        const review = reviewWith(createRunningAiStep({ startedOn: null }));

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result.message).toBe("AI tone check is reviewing");
    });

    it("names a running AI step by its title, never by the model", () => {
        const owner = createActor({ type: "ai", id: "user-1", displayName: "gpt-model-9" });
        const review = reviewWith(createRunningAiStep({ owner, startedOn: at(9, 5) }));

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result.message).toBe("AI tone check running since 09:05");
        expect(result.message).not.toContain("gpt-model-9");
    });

    it("reads '{Step} failed: {reason}' with the step comment as the reason", () => {
        const review = reviewWith(createFailedAutomationStep());

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result).toEqual({
            message: "Notify web team failed: Webhook returned 503 Service Unavailable",
            lockText: LOCK_IN_REVIEW
        });
    });

    it("reads '{Step} failed.' for a blank reason", () => {
        const review = reviewWith(createFailedAutomationStep({ comment: "  " }));

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result.message).toBe("Notify web team failed.");
    });

    it("leaves the message of a step a person reviews unchanged", () => {
        const step = createStep({
            title: "Legal sign-off",
            state: StepState.InReview,
            owner: createActor({ id: "user-2", displayName: "Luka Perić" }),
            startedOn: at(14, 20)
        });

        const result = getReviewMessage(params({ review: reviewWith(step), flags: createFlags() }));

        expect(result.message).toBe("Luka Perić is reviewing");
    });
});
