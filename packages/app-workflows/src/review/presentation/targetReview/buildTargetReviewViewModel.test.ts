import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buildTargetReviewViewModel } from "./buildTargetReviewViewModel.js";
import type { TargetReviewViewModelInput } from "./buildTargetReviewViewModel.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { at } from "~/review/testing/at.js";
import { createFailedAutomationStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";

const input = (overrides: Partial<TargetReviewViewModelInput> = {}): TargetReviewViewModelInput => {
    return {
        status: "none",
        failureKind: null,
        review: null,
        canRequest: true,
        isPublished: false,
        isUnpublished: false,
        viewerTeamIds: [],
        targetTitle: "Spring campaign",
        namespace: "cms.article",
        targetRevisionId: "entry-1#0001",
        busy: false,
        openAction: null,
        ...overrides
    };
};

const approvedReview = () => {
    return createReview({
        state: ReviewState.Approved,
        currentStepId: null,
        currentStepState: null,
        steps: [createStep({ state: StepState.Approved })]
    });
};

describe("buildTargetReviewViewModel", () => {
    it("shows nothing for a loading status except the skeleton text and no actions", () => {
        const vm = buildTargetReviewViewModel(input({ status: "loading" }));
        expect(vm.status).toBe("loading");
        expect(vm.reviewKind).toBe("none");
        expect(vm.message).toBe("Loading review status…");
        expect(vm.actions).toEqual([]);
        expect(vm.allowsEditing).toBe(false);
        expect(vm.allowsPublishing).toBe(false);
        expect(vm.publishDisabledReason).toBe("Checking review status…");
    });

    it("shows a failed load without actions and keeps editing and publishing off", () => {
        const vm = buildTargetReviewViewModel(input({ status: "failed", failureKind: "error" }));
        expect(vm.failureKind).toBe("error");
        expect(vm.message).toBe("Could not load the review status");
        expect(vm.lockText).toBe("Editing and publishing are unavailable until it loads.");
        expect(vm.actions).toEqual([]);
        expect(vm.tile).toBe("sync_problem");
        expect(vm.allowsEditing).toBe(false);
    });

    it("hides the title and the state for a read without access (R225)", () => {
        const vm = buildTargetReviewViewModel(input({ status: "failed", failureKind: "noAccess" }));
        expect(vm.failureKind).toBe("noAccess");
        expect(vm.stateTag).toBeNull();
        expect(vm.stepMeta).toBeNull();
        expect(vm.actions).toEqual([]);
    });

    it("offers Request review for content with a workflow and no review", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none" }));
        expect(vm.tile).toBe("rule");
        expect(vm.reviewKind).toBe("none");
        expect(vm.actions.map(action => action.kind)).toEqual(["request"]);
        expect(vm.allowsEditing).toBe(true);
        expect(vm.allowsPublishing).toBe(false);
    });

    it("hides Request review when the app does not allow it", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none", canRequest: false }));
        expect(vm.actions).toEqual([]);
    });

    it("shows no bar content for content without a workflow", () => {
        const vm = buildTargetReviewViewModel(input({ status: "noWorkflow" }));
        expect(vm.message).toBe("");
        expect(vm.actions).toEqual([]);
        expect(vm.allowsEditing).toBe(true);
        expect(vm.allowsPublishing).toBe(true);
    });

    it("describes an in-progress review from the server flags", () => {
        const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
        const review = createReview({
            currentStepId: "step-2",
            currentStepState: StepState.InReview,
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
        const withFlags = createReviewWithFlags(review, createFlags({ canTakeOver: true }));
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: withFlags, canRequest: true })
        );
        expect(vm.reviewId).toBe("review-1");
        expect(vm.reviewKind).toBe("inProgress");
        expect(vm.tile).toBe("rate_review");
        expect(vm.message).toBe("Luka Perić is reviewing");
        expect(vm.stepMeta).toBe("Step 2 of 2: Legal sign-off");
        expect(vm.ownerMeta).toBe("Owner: Luka Perić");
        expect(vm.stateTag).toEqual({ label: "Review: In progress", variant: "accent-light" });
        expect(vm.stepStateTag).toEqual({ label: "In review", variant: "accent-light" });
        expect(vm.progress?.approved).toBe(1);
        expect(vm.progress?.total).toBe(2);
        expect(vm.actions).toEqual([
            {
                kind: "takeOver",
                label: "Take over",
                icon: "front_hand",
                stepId: "step-2",
                emphasis: "secondary"
            }
        ]);
        expect(vm.allowsEditing).toBe(false);
        expect(vm.allowsPublishing).toBe(false);
        expect(vm.moveDisabledReason).toBe("Can’t move while this revision is in review.");
    });

    it("uses the hourglass tile for a step in the team pool", () => {
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: createReviewWithFlags() })
        );
        expect(vm.tile).toBe("hourglass_empty");
        expect(vm.ownerMeta).toBe("Owner: Team pool");
    });

    it("uses the check tile and allows publishing for an approved review", () => {
        const review = createReviewWithFlags(approvedReview());
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review, isPublished: true })
        );
        expect(vm.reviewKind).toBe("approved");
        expect(vm.tile).toBe("check_circle");
        expect(vm.stateTag).toEqual({ label: "Review: Approved", variant: "success-light" });
        expect(vm.allowsPublishing).toBe(true);
        expect(vm.allowsEditing).toBe(false);
        expect(vm.message).toBe("Approved and published");
    });

    it("keeps the rejecting step's name and tag for a rejected review (QBZ-52)", () => {
        const review = createReview({
            state: ReviewState.Rejected,
            currentStepId: "step-1",
            currentStepState: StepState.Rejected,
            steps: [
                createStep({
                    title: "Legal sign-off",
                    state: StepState.Rejected,
                    owner: createActor({ id: "user-2", displayName: "Ana Legal" })
                })
            ]
        });
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: createReviewWithFlags(review) })
        );
        expect(vm.reviewKind).toBe("rejected");
        expect(vm.tile).toBe("cancel");
        expect(vm.stepMeta).toBe("Step 1 of 1: Legal sign-off");
        expect(vm.ownerMeta).toBe("Owner: Ana Legal");
        expect(vm.stepStateTag).toEqual({ label: "Rejected", variant: "neutral-dark" });
    });

    it("carries the target the bar belongs to (R-f)", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none" }));

        expect(vm.targetTitle).toBe("Spring campaign");
        expect(vm.namespace).toBe("cms.article");
        expect(vm.targetRevisionId).toBe("entry-1#0001");
    });

    it("tells the three approved messages apart (R-h)", () => {
        const active = createReviewWithFlags(approvedReview());
        const published = buildTargetReviewViewModel(
            input({ status: "active", review: active, isPublished: true })
        );
        const unpublished = buildTargetReviewViewModel(
            input({ status: "active", review: active, isUnpublished: true })
        );
        const ready = buildTargetReviewViewModel(input({ status: "active", review: active }));

        expect(published.message).toBe("Approved and published");
        expect(unpublished.message).toBe(
            "Approved and unpublished. Publishing again needs no new review."
        );
        expect(ready.message).toBe("Approved, ready to publish");
    });

    it("enables Publish for an unpublished revision with no review (Q19)", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none", isUnpublished: true }));
        expect(vm.reviewKind).toBe("none");
        expect(vm.allowsPublishing).toBe(true);
        expect(vm.publishDisabledReason).toBeNull();
        expect(vm.allowsEditing).toBe(true);
    });

    it("keeps Publish disabled for a revision with no review that was never published", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none", isUnpublished: false }));
        expect(vm.allowsPublishing).toBe(false);
        expect(vm.publishDisabledReason).toBe(
            "Publishing needs an approved review. Request a review first."
        );
    });

    it("names the viewer's own teams in the pool message (QBZ-25)", () => {
        const review = createReview({
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
        const vm = buildTargetReviewViewModel(
            input({
                status: "active",
                review: createReviewWithFlags(review),
                viewerTeamIds: ["t2"]
            })
        );
        expect(vm.message).toBe("Waiting in the Legal team pool");
        expect(vm.ownerMeta).toBe("Owner: Team pool (Marketing, Legal)");
    });

    it("carries the open action and the busy flag", () => {
        const vm = buildTargetReviewViewModel(
            input({ status: "none", busy: true, openAction: { kind: "request", stepId: null } })
        );
        expect(vm.busy).toBe(true);
        expect(vm.openAction).toEqual({ kind: "request", stepId: null });
    });

    it("is render-ready: plain data only (R234)", () => {
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: createReviewWithFlags() })
        );
        expect(JSON.parse(JSON.stringify(vm))).toEqual(vm);
    });
});

describe("buildTargetReviewViewModel, running and failed steps (R263, R264)", () => {
    const reviewWith = (step: ReturnType<typeof createStep>) => {
        return createReviewWithFlags(
            createReview({
                currentStepId: step.id,
                currentStepState: step.state,
                steps: [step]
            }),
            createFlags()
        );
    };

    it("shows a running AI step with the progress tile, the Running tag and its tooltip", () => {
        const review = reviewWith(createRunningAiStep());

        const vm = buildTargetReviewViewModel(input({ status: "active", review }));

        expect(vm.tile).toBe("progress_activity");
        expect(vm.message).toBe("AI tone check running since 14:20");
        expect(vm.stepStateTag).toEqual({
            label: "Running",
            variant: "accent-light",
            icon: "progress_activity"
        });
        expect(vm.stepStateTooltip).toBe("AI tone check is running since 14:20.");
        expect(vm.ownerMeta).toBe("Owner: AI tone check");
        expect(vm.progress?.segments[0].message).toBe("AI tone check running since 14:20");
    });

    it("shows a failed automation step with the sync_problem tile and the Failed tag", () => {
        const review = reviewWith(createFailedAutomationStep());

        const vm = buildTargetReviewViewModel(input({ status: "active", review }));

        expect(vm.tile).toBe("sync_problem");
        expect(vm.message).toBe("Notify web team failed: Webhook returned 503 Service Unavailable");
        expect(vm.stepStateTag).toEqual({ label: "Failed", variant: "destructive" });
        expect(vm.stepStateTooltip).toBe(
            "Notify web team failed. The requester or an operator can restart it."
        );
    });

    it("has no tooltip and no icon for a step a person reviews", () => {
        const step = createStep({
            title: "Legal sign-off",
            state: StepState.InReview,
            owner: createActor({ id: "user-2", displayName: "Luka Perić" }),
            startedOn: at(14, 20)
        });

        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: reviewWith(step) })
        );

        expect(vm.tile).toBe("rate_review");
        expect(vm.stepStateTag).toEqual({ label: "In review", variant: "accent-light" });
        expect(vm.stepStateTooltip).toBeNull();
    });

    it("has no tooltip without a review", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none" }));

        expect(vm.stepStateTooltip).toBeNull();
    });
});
