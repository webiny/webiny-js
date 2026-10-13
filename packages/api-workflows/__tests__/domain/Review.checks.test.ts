import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
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
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

interface CheckParamsOverrides {
    stepId?: string;
    actorTeamIds?: string[];
}

const checkParams = (actor: Actor, overrides: CheckParamsOverrides = {}) => {
    return {
        stepId: overrides.stepId ?? "legal",
        actor,
        actorTeamIds: overrides.actorTeamIds ?? [REVIEW_TEAM_ID]
    };
};

/** The first step ("legal") is owned by an AI actor from step reached. */
const createAiOwnedReview = (): Review => {
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
    review.pullFacts();
    return review;
};

describe("Review checks", () => {
    it("records nothing and changes nothing", () => {
        const review = createStartedReview();
        const before = review.toData();

        review.checkStart(checkParams(otherReviewer));
        review.checkTakeOver(checkParams(otherReviewer));
        review.checkApprove(checkParams(reviewer));
        review.checkReject(checkParams(reviewer));
        review.checkCancel();
        review.checkReassign({ stepId: "legal" });

        expect(review.toData()).toEqual(before);
        expect(review.pullFacts()).toEqual([]);
    });

    it("lets a candidate start an awaiting step and fails like start otherwise", () => {
        const review = createRequestedReview();
        review.pullFacts();

        expect(review.checkStart(checkParams(reviewer)).isOk()).toBe(true);
        expect(review.checkStart(checkParams(requester)).error.code).toBe(
            "Workflows/Review/RequesterCannotReview"
        );
        expect(
            review.checkStart(checkParams(otherReviewer, { actorTeamIds: [OTHER_TEAM_ID] })).error
                .code
        ).toBe("Workflows/Review/NotCandidate");
        expect(review.checkStart(checkParams(aiActor)).error.code).toBe(
            "Workflows/Review/ActorNotUser"
        );
        expect(review.checkStart(checkParams(reviewer, { stepId: "editorial" })).error.code).toBe(
            "Workflows/Review/StepNotCurrent"
        );
    });

    it("returns the same error as the start transition", () => {
        const checked = createRequestedReview().checkStart(checkParams(requester));
        const started = createRequestedReview().start({ ...checkParams(requester), now: LATER });

        expect(checked.error.code).toBe(started.error.code);
        expect(checked.error.data).toEqual(started.error.data);
    });

    interface ParityCase {
        name: string;
        create: () => Review;
        params: ReturnType<typeof checkParams>;
    }

    const takeOverCases: ParityCase[] = [
        { name: "already the owner", create: createStartedReview, params: checkParams(reviewer) },
        { name: "requester", create: createStartedReview, params: checkParams(requester) },
        { name: "AI-owned step", create: createAiOwnedReview, params: checkParams(otherReviewer) },
        {
            name: "awaiting step",
            create: createRequestedReview,
            params: checkParams(otherReviewer)
        },
        {
            name: "stale step",
            create: createStartedReview,
            params: checkParams(otherReviewer, { stepId: "editorial" })
        }
    ];
    const decisionCases: ParityCase[] = [
        { name: "not the owner", create: createStartedReview, params: checkParams(otherReviewer) },
        { name: "awaiting step", create: createRequestedReview, params: checkParams(reviewer) },
        {
            name: "stale step",
            create: createStartedReview,
            params: checkParams(reviewer, { stepId: "editorial" })
        }
    ];

    it.each(takeOverCases)("takeOver check matches the transition: $name", testCase => {
        const checked = testCase.create().checkTakeOver(testCase.params);
        const done = testCase.create().takeOver({ ...testCase.params, now: LATER });

        expect(checked.isFail()).toBe(true);
        expect(checked.error.code).toBe(done.error.code);
        expect(checked.error.data).toEqual(done.error.data);
    });

    it.each(decisionCases)("approve check matches the transition: $name", testCase => {
        const checked = testCase.create().checkApprove(testCase.params);
        const done = testCase.create().approve({ ...testCase.params, now: LATER, comment: null });

        expect(checked.isFail()).toBe(true);
        expect(checked.error.code).toBe(done.error.code);
        expect(checked.error.data).toEqual(done.error.data);
    });

    it.each(decisionCases)("reject check matches the transition: $name", testCase => {
        const checked = testCase.create().checkReject(testCase.params);
        const done = testCase.create().reject({ ...testCase.params, now: LATER, comment: null });

        expect(checked.isFail()).toBe(true);
        expect(checked.error.code).toBe(done.error.code);
        expect(checked.error.data).toEqual(done.error.data);
    });

    it("cancel check matches the transition on a cancelled review", () => {
        const review = createStartedReview();
        expectOk(review.cancel({ actor: requester, now: LATER }));

        const checked = review.checkCancel();
        const done = review.cancel({ actor: requester, now: LATER });

        expect(checked.error.code).toBe(done.error.code);
        expect(checked.error.data).toEqual(done.error.data);
    });

    it("lets another candidate take over and fails like take over otherwise", () => {
        const review = createStartedReview();

        expect(review.checkTakeOver(checkParams(otherReviewer)).isOk()).toBe(true);
        expect(review.checkTakeOver(checkParams(reviewer)).error.code).toBe(
            "Workflows/Review/AlreadyOwner"
        );
        expect(review.checkTakeOver(checkParams(requester)).error.code).toBe(
            "Workflows/Review/RequesterCannotReview"
        );
        expect(createAiOwnedReview().checkTakeOver(checkParams(otherReviewer)).error.code).toBe(
            "Workflows/Review/StepNotTakeable"
        );
    });

    it("lets only the owner approve or reject", () => {
        const review = createStartedReview();

        expect(review.checkApprove(checkParams(reviewer)).isOk()).toBe(true);
        expect(review.checkReject(checkParams(reviewer)).isOk()).toBe(true);
        expect(review.checkApprove(checkParams(otherReviewer)).error.code).toBe(
            "Workflows/Review/NotOwner"
        );
        expect(review.checkReject(checkParams(otherReviewer)).error.code).toBe(
            "Workflows/Review/NotOwner"
        );
        expect(createRequestedReview().checkApprove(checkParams(reviewer)).error.code).toBe(
            "Workflows/Review/InvalidState"
        );
    });

    it("allows cancel only while the review is in progress", () => {
        const review = createStartedReview();
        expect(review.checkCancel().isOk()).toBe(true);

        expectOk(review.cancel({ actor: requester, now: LATER }));

        const cancelled = review.checkCancel();
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
        expect(cancelled.error.data.transition).toBe("cancel");
    });

    it("allows reassign on an awaiting or human in-review step (D33)", () => {
        expect(createRequestedReview().checkReassign({ stepId: "legal" }).isOk()).toBe(true);
        expect(createStartedReview().checkReassign({ stepId: "legal" }).isOk()).toBe(true);
    });

    it("does not allow reassign on an AI step, a stale step or a finished review", () => {
        const aiOwned = createAiOwnedReview().checkReassign({ stepId: "legal" });
        expect(aiOwned.error.code).toBe("Workflows/Review/StepNotReassignable");
        expect(aiOwned.error.data).toEqual({
            reviewId: "review-1",
            stepId: "legal",
            ownerType: "ai"
        });

        expect(createRequestedReview().checkReassign({ stepId: "editorial" }).error.code).toBe(
            "Workflows/Review/StepNotCurrent"
        );

        const rejected = createStartedReview();
        expectOk(
            rejected.reject({
                ...checkParams(reviewer),
                comment: "Needs another pass.",
                now: LATER
            })
        );
        const finished = rejected.checkReassign({ stepId: "legal" });
        expect(finished.error.code).toBe("Workflows/Review/InvalidState");
        expect(finished.error.data).toMatchObject({ transition: "reassign" });
    });

    it("exposes the current step id until every step is approved", () => {
        const review = createStartedReview();
        expect(review.actionableStepId).toBe("legal");

        expectOk(review.approve({ ...checkParams(reviewer), comment: null, now: LATER }));
        expect(review.actionableStepId).toBe("editorial");

        expectOk(review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));
        expectOk(review.start({ ...checkParams(reviewer, { stepId: "editorial" }), now: LATER }));
        expectOk(
            review.approve({
                ...checkParams(reviewer, { stepId: "editorial" }),
                comment: null,
                now: LATER
            })
        );
        expect(review.actionableStepId).toBeNull();
    });

    it("treats only the requesting user as the requester", () => {
        const review = createRequestedReview();

        expect(review.isRequestedBy(requester)).toBe(true);
        // AI actors carry the requester's id (D58) but are not the requester.
        expect(review.isRequestedBy(aiActor)).toBe(false);
        expect(review.isRequestedBy(reviewer)).toBe(false);
    });
});
