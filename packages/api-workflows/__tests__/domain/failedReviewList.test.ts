import { describe, expect, it } from "vitest";
import { matchesReviewList } from "~/domain/review/matchesReviewList.js";
import type { ReviewData, ReviewListKind } from "~/domain/review/types.js";
import { ARTICLE_MODEL, requester, REVIEW_TEAM_ID, toSaveData } from "~tests/__helpers/fixtures.js";
import {
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const matches = (review: ReviewData, list: ReviewListKind, viewerUserId: string): boolean => {
    return matchesReviewList(review, {
        list,
        viewerUserId,
        viewerTeamIds: [REVIEW_TEAM_ID],
        models: [ARTICLE_MODEL],
        where: {}
    });
};

describe("review lists with a step failed through Review.fail (D112)", () => {
    it("lists the failed automation step in failedSteps, and in no other list but the requester's", () => {
        const review = toSaveData(createFailedAutomationReview());

        expect(review).toMatchObject({
            currentStepState: "failed",
            currentStepType: "automation"
        });
        expect(matches(review, "failedSteps", "user-viewer")).toBe(true);
        expect(matches(review, "assignedToMe", requester.id)).toBe(false);
        expect(matches(review, "pool", "user-viewer")).toBe(false);
        expect(matches(review, "teamInReview", "user-viewer")).toBe(false);
        expect(matches(review, "myRequests", requester.id)).toBe(true);
        expect(matches(review, "myRequests", "user-viewer")).toBe(false);
    });

    it("filters the requester's own requests by the failed step state", () => {
        const review = toSaveData(createFailedAutomationReview());

        const failed = matchesReviewList(review, {
            list: "myRequests",
            viewerUserId: requester.id,
            viewerTeamIds: [],
            models: [ARTICLE_MODEL],
            where: { stepState: "failed" }
        });
        const inReview = matchesReviewList(review, {
            list: "myRequests",
            viewerUserId: requester.id,
            viewerTeamIds: [],
            models: [ARTICLE_MODEL],
            where: { stepState: "inReview" }
        });

        expect(failed).toBe(true);
        expect(inReview).toBe(false);
    });

    it("does not list a running automation step in failedSteps", () => {
        const review = toSaveData(createRunningAutomationReview());

        expect(matches(review, "failedSteps", "user-viewer")).toBe(false);
        // The automation actor owns it: nobody's assigned-to-me list shows it (A54).
        expect(matches(review, "assignedToMe", requester.id)).toBe(false);
    });
});
