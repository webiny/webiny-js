import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { BlockingReview } from "~/review/domain/types.js";
import { distinctReviewTargets } from "./distinctReviewTargets.js";

function review(overrides: Partial<BlockingReview>): BlockingReview {
    return {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 1,
        stepCount: 2,
        stepName: "Editor",
        ...overrides
    };
}

describe("distinctReviewTargets", () => {
    it("keeps the first review of every (model, targetId) in order", () => {
        const first = review({ reviewId: "r1" });
        const sameTarget = review({ reviewId: "r2", targetRevisionId: "entry-1#0002" });
        const otherEntry = review({ reviewId: "r3", targetId: "entry-2" });
        const otherModel = review({ reviewId: "r4", model: "cms.page" });

        const result = distinctReviewTargets([first, sameTarget, otherEntry, otherModel]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r3", "r4"]);
    });

    it("returns an empty list for no reviews", () => {
        expect(distinctReviewTargets([])).toEqual([]);
    });
});
