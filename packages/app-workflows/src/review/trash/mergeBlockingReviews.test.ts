import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import { mergeBlockingReviews } from "./mergeBlockingReviews.js";

function review(reviewId: string, targetId: string): BlockingReview {
    return {
        reviewId,
        model: "cms.article",
        targetId,
        targetRevisionId: `${targetId}#0001`,
        title: `Title ${reviewId}`,
        stepPosition: 1,
        stepCount: 2,
        stepName: "Editor"
    };
}

function data(reviews: BlockingReview[]): ActiveReviewOnTrashData {
    return { model: "cms.article", action: "trash", reviews };
}

describe("mergeBlockingReviews", () => {
    it("concatenates the reviews of every collected refusal in order", () => {
        const result = mergeBlockingReviews([
            data([review("r1", "e1")]),
            data([review("r2", "e2"), review("r3", "e2")])
        ]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r2", "r3"]);
    });

    it("lists a review that was collected twice only once", () => {
        const result = mergeBlockingReviews([
            data([review("r1", "e1")]),
            data([review("r1", "e1"), review("r2", "e2")])
        ]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r2"]);
    });

    it("returns an empty list for nothing collected", () => {
        expect(mergeBlockingReviews([])).toEqual([]);
    });
});
