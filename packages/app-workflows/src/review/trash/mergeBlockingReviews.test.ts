import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import { mergeBlockingReviews } from "./mergeBlockingReviews.js";
import { createBlockingReview } from "~/review/testing/reviewFixtures.js";

function data(reviews: BlockingReview[]): ActiveReviewOnTrashData {
    return { model: "cms.article", action: "trash", reviews };
}

describe("mergeBlockingReviews", () => {
    it("concatenates the reviews of every collected refusal in order", () => {
        const result = mergeBlockingReviews([
            data([createBlockingReview({ reviewId: "r1", targetId: "e1" })]),
            data([
                createBlockingReview({ reviewId: "r2", targetId: "e2" }),
                createBlockingReview({ reviewId: "r3", targetId: "e2" })
            ])
        ]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r2", "r3"]);
    });

    it("lists a review that was collected twice only once", () => {
        const result = mergeBlockingReviews([
            data([createBlockingReview({ reviewId: "r1", targetId: "e1" })]),
            data([
                createBlockingReview({ reviewId: "r1", targetId: "e1" }),
                createBlockingReview({ reviewId: "r2", targetId: "e2" })
            ])
        ]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r2"]);
    });

    it("returns an empty list for nothing collected", () => {
        expect(mergeBlockingReviews([])).toEqual([]);
    });
});
