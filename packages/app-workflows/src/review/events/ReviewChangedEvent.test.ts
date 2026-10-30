import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { ReviewChangedEvent } from "./ReviewChangedEvent.js";
import { ReviewChangedHandler } from "./ReviewChangedHandler.js";
import { createReview } from "~/review/testing/reviewFixtures.js";

describe("ReviewChangedEvent", () => {
    it("has the review changed event type and carries the payload as is", () => {
        const review = createReview();

        const event = new ReviewChangedEvent({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review
        });

        expect(event.eventType).toBe("workflows.review.changed");
        expect(event.payload).toEqual({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review
        });
        expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it("accepts a null review (no review any more)", () => {
        const event = new ReviewChangedEvent({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            review: null
        });

        expect(event.payload.review).toBeNull();
    });

    it("hands the publisher the review changed handler abstraction", () => {
        const event = new ReviewChangedEvent({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            review: null
        });

        expect(event.getHandlerAbstraction()).toBe(ReviewChangedHandler);
    });
});
