import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { ReviewCacheSyncHandler } from "./ReviewCacheSyncHandler.js";
import { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createReview } from "~/review/testing/reviewFixtures.js";

const createEvent = (review: ReturnType<typeof createReview> | null): ReviewChangedEvent => {
    return new ReviewChangedEvent({
        namespace: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        review
    });
};

describe("ReviewCacheSyncHandler", () => {
    const writer = {
        canHandle: vi.fn(),
        write: vi.fn()
    };

    beforeEach(() => {
        writer.canHandle.mockReset();
        writer.write.mockReset();
        writer.canHandle.mockReturnValue(true);
    });

    it("writes toSystemWorkflow(review) for the event target", async () => {
        const handler = new ReviewCacheSyncHandler(writer);

        await handler.handle(createEvent(createReview()));

        expect(writer.canHandle).toHaveBeenCalledWith("cms.article");
        expect(writer.write).toHaveBeenCalledTimes(1);
        expect(writer.write).toHaveBeenCalledWith(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            {
                workflowId: "workflow-1",
                reviewState: ReviewState.InProgress,
                stepId: "step-1",
                stepName: "Editorial check",
                stepState: StepState.Awaiting
            }
        );
    });

    it("writes null when the review is gone", async () => {
        const handler = new ReviewCacheSyncHandler(writer);

        await handler.handle(createEvent(null));

        expect(writer.write).toHaveBeenCalledWith(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            null
        );
    });

    it("writes null for a cancelled review (the target is unlocked)", async () => {
        const handler = new ReviewCacheSyncHandler(writer);
        const cancelled = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            currentStepId: null,
            currentStepState: null
        });

        await handler.handle(createEvent(cancelled));

        expect(writer.write).toHaveBeenCalledWith(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            null
        );
    });

    it("ignores a namespace the writer cannot handle", async () => {
        writer.canHandle.mockReturnValue(false);
        const handler = new ReviewCacheSyncHandler(writer);

        await handler.handle(createEvent(createReview()));

        expect(writer.canHandle).toHaveBeenCalledWith("cms.article");
        expect(writer.write).not.toHaveBeenCalled();
    });
});
