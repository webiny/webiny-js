import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { distinctReviewTargets } from "./distinctReviewTargets.js";
import { createBlockingReview } from "~/review/testing/reviewFixtures.js";

describe("distinctReviewTargets", () => {
    it("keeps the first review of every (model, targetId) in order", () => {
        const first = createBlockingReview({ reviewId: "r1" });
        const sameTarget = createBlockingReview({
            reviewId: "r2",
            targetRevisionId: "entry-1#0002"
        });
        const otherEntry = createBlockingReview({ reviewId: "r3", targetId: "entry-2" });
        const otherModel = createBlockingReview({ reviewId: "r4", model: "cms.page" });

        const result = distinctReviewTargets([first, sameTarget, otherEntry, otherModel]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r3", "r4"]);
    });

    it("returns an empty list for no reviews", () => {
        expect(distinctReviewTargets([])).toEqual([]);
    });
});
