import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    otherReviewer,
    requester,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { CancelTargetReviewsUseCase } from "~/features/review/CancelTargetReviews/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

/**
 * article-1#0001: in progress (review-1); article-1#0002: in progress (review-2);
 * article-1#0003: cancelled (review-3); article-2#0001: in progress (review-4), another target.
 */
const createTargetReviews = async () => {
    recordedEvents.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    const repository = context.container.resolve(ReviewRepository);

    expectOk(await repository.create(toSaveData(createRequestedReview({ id: "review-1" }))));
    expectOk(
        await repository.create(
            toSaveData(
                createRequestedReview({ id: "review-2", targetRevisionId: "article-1#0002" })
            )
        )
    );
    const cancelled = createRequestedReview({ id: "review-3", targetRevisionId: "article-1#0003" });
    expectOk(cancelled.cancel({ actor: requester, now: LATER }));
    expectOk(await repository.create(toSaveData(cancelled)));
    expectOk(
        await repository.create(
            toSaveData(
                createRequestedReview({ id: "review-4", targetRevisionId: "article-2#0001" })
            )
        )
    );
    recordedEvents.length = 0;

    return {
        repository,
        cancelTargetReviews: context.container.resolve(CancelTargetReviewsUseCase)
    };
};

describe("CancelTargetReviewsUseCase", () => {
    it("cancels every in-progress review of a target as the actor, with the reason", async () => {
        const { repository, cancelTargetReviews } = await createTargetReviews();

        const cancelled = expectOk(
            await cancelTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                actor: otherReviewer,
                reason: "content trashed"
            })
        );

        expect(cancelled.map(review => review.id).sort()).toEqual(["review-1", "review-2"]);
        expect(cancelled.every(review => review.state === "cancelled")).toBe(true);
        expect(expectOk(await repository.get("review-4")).state).toBe("inProgress");
        const facts = recordedEvents
            .filter(event => event.eventType === "Workflows/Review/Cancelled")
            .map(event => event.payload.fact);
        expect(facts).toHaveLength(2);
        expect(facts[0]).toMatchObject({ actor: otherReviewer, reason: "content trashed" });
    });

    it("cancels only the review of one revision when it is given", async () => {
        const { repository, cancelTargetReviews } = await createTargetReviews();

        const cancelled = expectOk(
            await cancelTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0002",
                actor: otherReviewer,
                reason: "content deleted"
            })
        );

        expect(cancelled.map(review => review.id)).toEqual(["review-2"]);
        expect(expectOk(await repository.get("review-1")).state).toBe("inProgress");
    });

    it("cancels nothing for a target without an in-progress review", async () => {
        const { cancelTargetReviews } = await createTargetReviews();

        const cancelled = expectOk(
            await cancelTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-9",
                actor: otherReviewer,
                reason: "content trashed"
            })
        );

        expect(cancelled).toEqual([]);
    });
});
