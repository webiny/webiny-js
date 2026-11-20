import { describe, expect, it } from "vitest";
import { matchesReviewList } from "~/domain/review/matchesReviewList.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewListScope } from "~/domain/review/ReviewListScope.js";
import type { ReviewListState } from "~/domain/review/ReviewListState.js";
import { ARTICLE_MODEL, requester, REVIEW_TEAM_ID, toSaveData } from "~tests/__helpers/fixtures.js";
import {
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const matches = (
    review: ReviewData,
    scope: ReviewListScope,
    viewerUserId: string,
    state: ReviewListState = "failed"
): boolean => {
    return matchesReviewList(review, {
        scope,
        viewerUserId,
        viewerTeamIds: [REVIEW_TEAM_ID],
        models: [ARTICLE_MODEL],
        where: { state }
    });
};

describe("review lists with a step failed through Review.fail (D112)", () => {
    it("lists the failed automation step as failed in all, and in no other scope but the requester's", () => {
        const review = toSaveData(createFailedAutomationReview());

        expect(review).toMatchObject({
            currentStepState: "failed",
            currentStepType: "automation"
        });
        expect(matches(review, "all", "user-viewer")).toBe(true);
        expect(matches(review, "assignedToMe", requester.id)).toBe(false);
        expect(matches(review, "pool", "user-viewer")).toBe(false);
        expect(matches(review, "teamInReview", "user-viewer")).toBe(false);
        expect(matches(review, "myRequests", requester.id)).toBe(true);
        expect(matches(review, "myRequests", "user-viewer")).toBe(false);
    });

    it("filters the requester's own requests by the failed state", () => {
        const review = toSaveData(createFailedAutomationReview());

        expect(matches(review, "myRequests", requester.id, "failed")).toBe(true);
        expect(matches(review, "myRequests", requester.id, "inReview")).toBe(false);
        expect(matches(review, "myRequests", requester.id, "all")).toBe(true);
    });

    it("does not list a running automation step as failed", () => {
        const review = toSaveData(createRunningAutomationReview());

        expect(matches(review, "all", "user-viewer")).toBe(false);
        expect(matches(review, "all", "user-viewer", "inReview")).toBe(true);
        // The automation actor owns it: nobody's assigned-to-me list shows it (A54).
        expect(matches(review, "assignedToMe", requester.id, "all")).toBe(false);
    });
});
