import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapBlockingReview } from "./mapBlockingReview.js";
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";

describe("mapBlockingReview", () => {
    it("maps the eight fields of a review in progress", () => {
        const review = mapBlockingReview(
            createBlockingReviewDto({
                reviewId: "review-4",
                model: "cms.article",
                targetId: "entry-4",
                targetRevisionId: "entry-4#0003",
                title: "Launch article",
                stepPosition: 2,
                stepCount: 3,
                stepName: "Legal sign-off"
            })
        );

        expect(review).toEqual({
            reviewId: "review-4",
            model: "cms.article",
            targetId: "entry-4",
            targetRevisionId: "entry-4#0003",
            title: "Launch article",
            stepPosition: 2,
            stepCount: 3,
            stepName: "Legal sign-off"
        });
    });
});
