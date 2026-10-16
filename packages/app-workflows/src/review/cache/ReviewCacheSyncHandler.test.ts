import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import { ReviewCacheSyncHandler } from "./ReviewCacheSyncHandler.js";
import type { IReviewCacheWriter } from "./IReviewCacheWriter.js";
import { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import { ReviewChangedHandler } from "~/review/events/ReviewChangedHandler.js";
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

    it("is bound per app by subclasses: each resolves with its own writer in one container", async () => {
        const WriterA = createAbstraction<IReviewCacheWriter>("Test/ReviewCacheWriterA");
        const WriterB = createAbstraction<IReviewCacheWriter>("Test/ReviewCacheWriterB");

        class HandlerAImpl
            extends ReviewCacheSyncHandler
            implements ReviewChangedHandler.Interface {}
        class HandlerBImpl
            extends ReviewCacheSyncHandler
            implements ReviewChangedHandler.Interface {}

        const writerA = {
            canHandle: vi.fn((namespace: string) => namespace === "cms.article"),
            write: vi.fn()
        };
        const writerB = {
            canHandle: vi.fn((namespace: string) => namespace === "wb.page"),
            write: vi.fn()
        };
        const container = new Container();
        container.registerInstance(WriterA, writerA);
        container.registerInstance(WriterB, writerB);
        container.register(
            ReviewChangedHandler.createImplementation({
                implementation: HandlerAImpl,
                dependencies: [WriterA]
            })
        );
        container.register(
            ReviewChangedHandler.createImplementation({
                implementation: HandlerBImpl,
                dependencies: [WriterB]
            })
        );
        const event = createEvent(createReview());

        const handlers = container.resolveAll(event.getHandlerAbstraction());
        for (const handler of handlers) {
            await handler.handle(event);
        }

        expect(handlers).toHaveLength(2);
        expect(writerA.write).toHaveBeenCalledTimes(1);
        expect(writerB.write).not.toHaveBeenCalled();
        expect(writerB.canHandle).toHaveBeenCalledWith("cms.article");
    });

    it("the shared class carries no abstraction metadata, so it cannot be registered as is", () => {
        const container = new Container();

        expect(() => container.register(ReviewCacheSyncHandler)).toThrow(
            "No abstraction metadata found"
        );
    });
});
