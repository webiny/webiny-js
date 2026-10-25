import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import { getReviewViewerFlags } from "~/domain/review/getReviewViewerFlags.js";
import { canRestartByPermission } from "~/domain/review/canRestartByPermission.js";
import type { Actor, ReviewData, ReviewViewer, ReviewViewerFlags } from "~/domain/review/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import {
    aiActor,
    ARTICLE_MODEL,
    createRequestedReview,
    createStartedReview,
    createWorkflow,
    expectOk,
    NOW,
    OTHER_TEAM_ID,
    otherReviewer,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    createFailedAutomationReview,
    createPendingAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const LATER = "2026-10-09T11:00:00.000Z";

const NO_PERMISSIONS: WorkflowsPermissionSet = {
    fullAccess: false,
    editor: false,
    reassign: false
};
const REASSIGN: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: true };
const FULL_ACCESS: WorkflowsPermissionSet = { fullAccess: true, editor: true, reassign: true };

const NO_FLAGS: ReviewViewerFlags = {
    canStart: false,
    canTakeOver: false,
    canApprove: false,
    canReject: false,
    canCancel: false,
    canReassign: false,
    canRestart: false
};

interface ViewerOverrides {
    teamIds?: string[];
    permissions?: WorkflowsPermissionSet;
}

const viewerOf = (actor: Actor, overrides: ViewerOverrides = {}): ReviewViewer => {
    return {
        actor,
        teamIds: overrides.teamIds ?? [REVIEW_TEAM_ID],
        permissions: overrides.permissions ?? NO_PERMISSIONS
    };
};

/** A user outside the step's teams. */
const outsiderOf = (permissions: WorkflowsPermissionSet = NO_PERMISSIONS): ReviewViewer => {
    return viewerOf(otherReviewer, { teamIds: [OTHER_TEAM_ID], permissions });
};

const legal = (actor: Actor) => {
    return { stepId: "legal", actor, actorTeamIds: [REVIEW_TEAM_ID], now: LATER };
};

/** "legal" is `awaiting` in the pool. */
const awaitingReview = (): ReviewData => toSaveData(createRequestedReview());

/** "legal" is `inReview`, held by `reviewer`. */
const inReviewReview = (): ReviewData => toSaveData(createStartedReview());

/** "legal" is `inReview`, held by an AI actor. */
const aiOwnedReview = (): ReviewData => {
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow: createWorkflow(),
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks: [],
            requester,
            now: NOW
        })
    );
    expectOk(
        review.reach({
            resolution: {
                owner: aiActor,
                candidateTeamIds: [REVIEW_TEAM_ID],
                assignment: { source: "roundRobin" },
                records: []
            },
            actor: requester,
            now: NOW
        })
    );
    return toSaveData(review);
};

const automationActor: Actor = {
    type: "automation",
    id: "user-requester",
    displayName: "Automation check"
};

/** "legal" is approved; "editorial" is `pending`, not reached yet. */
const pendingNextStepReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.approve({ ...legal(reviewer), comment: null }));
    return toSaveData(review);
};

const approvedReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.approve({ ...legal(reviewer), comment: null }));
    expectOk(review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));
    expectOk(review.start({ ...legal(reviewer), stepId: "editorial" }));
    expectOk(review.approve({ ...legal(reviewer), stepId: "editorial", comment: null }));
    return toSaveData(review);
};

const rejectedReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.reject({ ...legal(reviewer), comment: "Needs sources." }));
    return toSaveData(review);
};

const cancelledReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.cancel({ actor: requester, now: LATER }));
    return toSaveData(review);
};

/** The automation step failed; the review is still in progress (D8). */
const failedReview = (): ReviewData => toSaveData(createFailedAutomationReview());

/** The automation step is `inReview`, owned by the automation actor. */
const runningAutomationReview = (): ReviewData => toSaveData(createRunningAutomationReview());

/** The automation step failed while still `pending`: it never started a task. */
const failedBeforeStartReview = (): ReviewData => {
    const review = createPendingAutomationReview();
    expectOk(
        review.fail({
            stepId: AUTOMATION_STEP_ID,
            reason: 'The automation "test-automation" is not available.',
            now: LATER
        })
    );
    return toSaveData(review);
};

/** The automation rejected its step: the review is rejected and final (D10). */
const rejectedAutomationReview = (): ReviewData => {
    const review = createRunningAutomationReview();
    expectOk(
        review.reject({
            stepId: AUTOMATION_STEP_ID,
            actor: automationActor,
            actorTeamIds: [],
            comment: "Does not meet the policy.",
            now: LATER
        })
    );
    return toSaveData(review);
};

/** What the transitions themselves allow for the viewer on the current step. */
const transitionResults = (data: ReviewData, viewer: ReviewViewer) => {
    const params = {
        stepId: Review.fromData(data).actionableStepId ?? data.steps[0].id,
        actor: viewer.actor,
        actorTeamIds: viewer.teamIds,
        now: LATER
    };
    return {
        canStart: Review.fromData(data).start(params).isOk(),
        canTakeOver: Review.fromData(data).takeOver(params).isOk(),
        canApprove: Review.fromData(data)
            .approve({ ...params, comment: null })
            .isOk(),
        canReject: Review.fromData(data)
            .reject({ ...params, comment: "Needs another pass." })
            .isOk()
    };
};

describe("getReviewViewerFlags", () => {
    it("lets a candidate start an awaiting step", () => {
        expect(getReviewViewerFlags(awaitingReview(), viewerOf(reviewer))).toEqual({
            ...NO_FLAGS,
            canStart: true
        });
    });

    it("lets the requester cancel, but not start, their own review (D25)", () => {
        expect(getReviewViewerFlags(awaitingReview(), viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true
        });
    });

    it("gives a user outside the step's teams nothing", () => {
        expect(getReviewViewerFlags(awaitingReview(), outsiderOf())).toEqual(NO_FLAGS);
    });

    it("lets reassign holders cancel and reassign (D33, D54)", () => {
        expect(getReviewViewerFlags(awaitingReview(), outsiderOf(REASSIGN))).toEqual({
            ...NO_FLAGS,
            canCancel: true,
            canReassign: true
        });
    });

    it("treats full access like reassign", () => {
        expect(getReviewViewerFlags(inReviewReview(), outsiderOf(FULL_ACCESS))).toEqual({
            ...NO_FLAGS,
            canCancel: true,
            canReassign: true
        });
    });

    it("lets the owner approve or reject, and another candidate take over (D32)", () => {
        const data = inReviewReview();

        expect(getReviewViewerFlags(data, viewerOf(reviewer))).toEqual({
            ...NO_FLAGS,
            canApprove: true,
            canReject: true
        });
        expect(getReviewViewerFlags(data, viewerOf(otherReviewer))).toEqual({
            ...NO_FLAGS,
            canTakeOver: true
        });
    });

    it("offers no take over or reassign on an AI step (D9, D33)", () => {
        const data = aiOwnedReview();

        expect(
            getReviewViewerFlags(data, viewerOf(otherReviewer, { permissions: REASSIGN }))
        ).toEqual({ ...NO_FLAGS, canCancel: true });
        // The AI owner carries the requester's id (D58); the requester still cannot decide.
        expect(getReviewViewerFlags(data, viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true
        });
    });

    it("lets an AI owner decide, though it carries the requester's id (D58)", () => {
        const data = aiOwnedReview();

        expect(getReviewViewerFlags(data, viewerOf(aiActor))).toEqual({
            ...NO_FLAGS,
            canApprove: true,
            canReject: true
        });
    });

    it("offers no step action while the next step is still pending", () => {
        expect(
            getReviewViewerFlags(
                pendingNextStepReview(),
                viewerOf(reviewer, { permissions: REASSIGN })
            )
        ).toMatchObject({
            canStart: false,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: true
        });
    });

    it("lets the requester restart a failed step, and cancel the review (D34)", () => {
        expect(getReviewViewerFlags(failedReview(), viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true,
            canRestart: true
        });
    });

    it("lets reassign holders and full access restart a failed step (D34, D54)", () => {
        const expected = { ...NO_FLAGS, canCancel: true, canRestart: true };

        expect(getReviewViewerFlags(failedReview(), outsiderOf(REASSIGN))).toEqual(expected);
        expect(getReviewViewerFlags(failedReview(), outsiderOf(FULL_ACCESS))).toEqual(expected);
    });

    it("offers a failed step to nobody else, whatever their teams", () => {
        const data = failedReview();

        expect(getReviewViewerFlags(data, viewerOf(reviewer))).toEqual(NO_FLAGS);
        expect(getReviewViewerFlags(data, viewerOf(otherReviewer))).toEqual(NO_FLAGS);
        expect(getReviewViewerFlags(data, outsiderOf())).toEqual(NO_FLAGS);
        // The automation actor carries the requester's id (D58) but is not the requester.
        expect(getReviewViewerFlags(data, viewerOf(automationActor))).toEqual(NO_FLAGS);
        expect(getReviewViewerFlags(data, viewerOf(aiActor))).toEqual(NO_FLAGS);
    });

    it("offers no start, take over, approve, reject or reassign on a failed step", () => {
        expect(
            getReviewViewerFlags(failedReview(), viewerOf(requester, { permissions: FULL_ACCESS }))
        ).toEqual({ ...NO_FLAGS, canCancel: true, canRestart: true });
    });

    it("lets the requester restart a step that failed before it started", () => {
        expect(getReviewViewerFlags(failedBeforeStartReview(), viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true,
            canRestart: true
        });
    });

    it("offers no restart while the automation step is still running", () => {
        const data = runningAutomationReview();

        expect(getReviewViewerFlags(data, viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true
        });
        expect(getReviewViewerFlags(data, outsiderOf(FULL_ACCESS)).canRestart).toBe(false);
    });

    it("never offers restart on a rejected step: reject is final (D10)", () => {
        const data = rejectedAutomationReview();

        expect(
            getReviewViewerFlags(data, viewerOf(requester, { permissions: FULL_ACCESS }))
        ).toEqual(NO_FLAGS);
    });

    it("offers no restart on a cancelled review with a failed step", () => {
        const review = createFailedAutomationReview();
        expectOk(review.cancel({ actor: requester, now: LATER }));
        const data = toSaveData(review);

        expect(
            getReviewViewerFlags(data, viewerOf(requester, { permissions: FULL_ACCESS }))
        ).toEqual(NO_FLAGS);
    });

    it("agrees with the restart check and the permission predicate for every viewer", () => {
        const reviews = [
            failedReview(),
            failedBeforeStartReview(),
            runningAutomationReview(),
            rejectedAutomationReview(),
            awaitingReview(),
            approvedReview(),
            cancelledReview()
        ];
        const viewers = [
            viewerOf(requester),
            viewerOf(reviewer),
            viewerOf(aiActor),
            viewerOf(automationActor),
            outsiderOf(REASSIGN),
            outsiderOf(FULL_ACCESS)
        ];

        for (const data of reviews) {
            const review = Review.fromData(data);
            for (const viewer of viewers) {
                const stepId = review.actionableStepId;
                const expected =
                    stepId !== null &&
                    review.checkRestart({ stepId }).isOk() &&
                    canRestartByPermission(data, viewer);
                expect(getReviewViewerFlags(data, viewer).canRestart).toBe(expected);
            }
        }
    });

    it.each([
        ["approved", approvedReview],
        ["rejected", rejectedReview],
        ["cancelled", cancelledReview]
    ])("offers nothing on a %s review, not even restart", (_state, createData) => {
        const data = createData();

        expect(
            getReviewViewerFlags(data, viewerOf(requester, { permissions: FULL_ACCESS }))
        ).toEqual(NO_FLAGS);
        expect(getReviewViewerFlags(data, viewerOf(reviewer))).toEqual(NO_FLAGS);
    });

    it("agrees with the transitions for every review and viewer", () => {
        const reviews = [
            awaitingReview(),
            inReviewReview(),
            aiOwnedReview(),
            pendingNextStepReview(),
            approvedReview(),
            rejectedReview(),
            cancelledReview(),
            failedReview(),
            runningAutomationReview()
        ];
        const viewers = [
            viewerOf(requester),
            viewerOf(reviewer),
            viewerOf(otherReviewer),
            viewerOf(aiActor),
            viewerOf(automationActor),
            outsiderOf(FULL_ACCESS)
        ];

        for (const data of reviews) {
            for (const viewer of viewers) {
                expect(getReviewViewerFlags(data, viewer)).toMatchObject(
                    transitionResults(data, viewer)
                );
            }
        }
    });

    it("treats a review without a current step as having nothing to act on", () => {
        const approved = approvedReview();
        expect(Review.fromData(approved).actionableStepId).toBeNull();
        expect(
            getReviewViewerFlags(approved, viewerOf(reviewer, { permissions: FULL_ACCESS }))
        ).toEqual(NO_FLAGS);
    });

    it("keeps the current step after a cancel but offers no action on it", () => {
        const cancelled = cancelledReview();
        expect(Review.fromData(cancelled).actionableStepId).toBe("legal");
        expect(
            getReviewViewerFlags(cancelled, viewerOf(reviewer, { permissions: FULL_ACCESS }))
        ).toEqual(NO_FLAGS);
    });

    it("does not change the review it reads", () => {
        const data = inReviewReview();
        const copy = structuredClone(data);

        getReviewViewerFlags(data, viewerOf(otherReviewer, { permissions: FULL_ACCESS }));

        expect(data).toEqual(copy);
    });
});
