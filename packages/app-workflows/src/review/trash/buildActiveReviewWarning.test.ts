import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { BlockingReview } from "~/review/domain/types.js";
import { buildActiveReviewWarning } from "./buildActiveReviewWarning.js";

function review(overrides: Partial<BlockingReview>): BlockingReview {
    return {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal",
        ...overrides
    };
}

describe("buildActiveReviewWarning", () => {
    it("builds the trash texts and one line per review", () => {
        const result = buildActiveReviewWarning({
            action: "trash",
            reviews: [
                review({}),
                review({
                    reviewId: "review-2",
                    title: "Spring campaign",
                    stepPosition: 1,
                    stepCount: 1,
                    stepName: "Editor"
                })
            ]
        });

        expect(result.title).toBe("Review in progress");
        expect(result.body).toBe(
            "This content has a review in progress. Trashing it cancels the review."
        );
        expect(result.reviews).toEqual([
            "Launch article · Step 2 of 3 (Legal)",
            "Spring campaign · Step 1 of 1 (Editor)"
        ]);
    });

    it("builds the delete body", () => {
        const result = buildActiveReviewWarning({ action: "delete", reviews: [review({})] });

        expect(result.body).toBe(
            "This content has a review in progress. Deleting it cancels the review."
        );
    });

    it("leaves the parenthesis out when the step has no name", () => {
        const result = buildActiveReviewWarning({
            action: "trash",
            reviews: [review({ stepName: "" })]
        });

        expect(result.reviews).toEqual(["Launch article · Step 2 of 3"]);
    });
});
