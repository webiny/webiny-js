import { describe, expect, it } from "vitest";
import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";
import { Container } from "@webiny/feature/api";
import {
    MAX_BLOCKING_REVIEW_CHECKS,
    ReadableBlockingReviewsService
} from "~/features/workflow/ReadableBlockingReviews/abstractions.js";
import { ReadableBlockingReviewsFeature } from "~/features/workflow/ReadableBlockingReviews/feature.js";
import { belongsToApp, isAppWorkflow } from "~/domain/workflow/isAppWorkflow.js";
import { getDeleteCancelReason } from "~/domain/review/getDeleteCancelReason.js";
import { createWorkflowValues } from "~tests/__helpers/fixtures.js";

const createBlockingReviews = (count: number): WorkflowBlockingReview[] => {
    return Array.from({ length: count }, (_, index) => {
        return {
            reviewId: `review-${index + 1}`,
            model: "cms.article",
            targetId: `article-${index + 1}`,
            targetRevisionId: `article-${index + 1}#0001`,
            title: `Article ${index + 1}`,
            stepPosition: 1,
            stepCount: 1,
            stepName: "Step 1"
        };
    });
};

const createService = (): ReadableBlockingReviewsService.Interface => {
    const container = new Container();
    ReadableBlockingReviewsFeature.register(container);
    return container.resolve(ReadableBlockingReviewsService);
};

const isCms = (model: string): boolean => model.startsWith("cms.");

describe("ReadableBlockingReviewsService (D115)", () => {
    it("keeps the first five readable reviews in order", async () => {
        const reviews = createBlockingReviews(12);
        // Every odd review is unreadable.
        const readable = await createService().filter(reviews, async review => {
            return Number(review.reviewId.split("-")[1]) % 2 === 0;
        });

        expect(readable.map(review => review.reviewId)).toEqual([
            "review-2",
            "review-4",
            "review-6",
            "review-8",
            "review-10"
        ]);
    });

    it("stops reading once five reviews are readable", async () => {
        const reviews = createBlockingReviews(12);
        let checks = 0;

        // Review 2, 4, ... are readable: the fifth one is review 10, so reviews 11 and 12 are never read.
        const readable = await createService().filter(reviews, async review => {
            checks++;
            return Number(review.reviewId.split("-")[1]) % 2 === 0;
        });

        expect(readable).toHaveLength(5);
        expect(checks).toBe(10);
    });

    it("checks at most 50 reviews (R76)", async () => {
        const reviews = createBlockingReviews(80);
        let checks = 0;

        const readable = await createService().filter(reviews, async () => {
            checks++;
            return false;
        });

        expect(readable).toEqual([]);
        expect(checks).toBe(MAX_BLOCKING_REVIEW_CHECKS);
    });

    it("counts a failed check as unreadable", async () => {
        const reviews = createBlockingReviews(3);

        const readable = await createService().filter(reviews, async review => {
            if (review.reviewId === "review-2") {
                throw new Error("Storage is down.");
            }
            return true;
        });

        expect(readable.map(review => review.reviewId)).toEqual(["review-1", "review-3"]);
    });
});

describe("isAppWorkflow (R46)", () => {
    it("accepts only workflows whose every model is the app's", () => {
        expect(belongsToApp(["cms.article", "cms.author"], isCms)).toBe(true);
        expect(belongsToApp(["cms.article", "wb.page"], isCms)).toBe(false);
        expect(isAppWorkflow(createWorkflowValues(), isCms)).toBe(true);
        expect(isAppWorkflow(createWorkflowValues({ models: ["wb.page"] }), isCms)).toBe(false);
        expect(isAppWorkflow(createWorkflowValues({ models: [] }), isCms)).toBe(false);
    });
});

describe("getDeleteCancelReason (D134)", () => {
    it("names why the review was cancelled", () => {
        expect(getDeleteCancelReason("trash")).toBe("content trashed");
        expect(getDeleteCancelReason("delete")).toBe("content deleted");
    });
});
