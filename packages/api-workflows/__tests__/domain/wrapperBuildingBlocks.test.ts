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

const isEven = (review: WorkflowBlockingReview): boolean => {
    return Number(review.reviewId.split("-")[1]) % 2 === 0;
};

describe("ReadableBlockingReviewsService (D115)", () => {
    it("keeps the first five readable reviews in order", async () => {
        const reviews = createBlockingReviews(12);
        // Every odd review is unreadable; the check answers in reverse order.
        const readable = await createService().filter(reviews, async checked => {
            return checked.filter(isEven).reverse();
        });

        expect(readable.map(review => review.reviewId)).toEqual([
            "review-2",
            "review-4",
            "review-6",
            "review-8",
            "review-10"
        ]);
    });

    it("checks at most 50 reviews in one read check (R76)", async () => {
        const reviews = createBlockingReviews(80);
        const calls: number[] = [];

        const readable = await createService().filter(reviews, async checked => {
            calls.push(checked.length);
            return [];
        });

        expect(readable).toEqual([]);
        expect(calls).toEqual([MAX_BLOCKING_REVIEW_CHECKS]);
    });

    it("makes no read check without reviews", async () => {
        let calls = 0;

        const readable = await createService().filter([], async () => {
            calls++;
            return [];
        });

        expect(readable).toEqual([]);
        expect(calls).toBe(0);
    });

    it("counts every review as unreadable when the check fails", async () => {
        const reviews = createBlockingReviews(3);

        const readable = await createService().filter(reviews, async () => {
            throw new Error("Storage is down.");
        });

        expect(readable).toEqual([]);
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
