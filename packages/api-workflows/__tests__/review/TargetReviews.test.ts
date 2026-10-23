import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    createWorkflowValues,
    editor,
    expectOk,
    requester,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetTargetReviewUseCase } from "~/features/review/GetTargetReview/index.js";
import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetBoundWorkflowUseCase } from "~/features/workflow/GetBoundWorkflow/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

/**
 * article-1#0001: active (review-1); article-1#0002: cancelled (review-2);
 * article-2#0001: active (review-3), another target.
 */
const createTargetReviews = async () => {
    const { context } = await createContextHandler();
    const repository = context.container.resolve(ReviewRepository);

    expectOk(await repository.create(toSaveData(createRequestedReview({ id: "review-1" }))));
    const cancelled = createRequestedReview({
        id: "review-2",
        targetRevisionId: "article-1#0002"
    });
    expectOk(cancelled.cancel({ actor: requester, now: LATER }));
    expectOk(await repository.create(toSaveData(cancelled)));
    expectOk(
        await repository.create(
            toSaveData(
                createRequestedReview({ id: "review-3", targetRevisionId: "article-2#0001" })
            )
        )
    );

    return {
        getTargetReview: context.container.resolve(GetTargetReviewUseCase),
        listTargetReviews: context.container.resolve(ListTargetReviewsUseCase)
    };
};

describe("Target review queries", () => {
    it("gets the active review of a revision", async () => {
        const { getTargetReview } = await createTargetReviews();

        const active = expectOk(
            await getTargetReview.execute({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-1#0001"
            })
        );

        expect(active?.id).toBe("review-1");
    });

    it("returns null for a revision whose review was cancelled or that has none", async () => {
        const { getTargetReview } = await createTargetReviews();

        const cancelled = expectOk(
            await getTargetReview.execute({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-1#0002"
            })
        );
        const none = expectOk(
            await getTargetReview.execute({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-9#0001"
            })
        );
        const otherModel = expectOk(
            await getTargetReview.execute({ model: "wb.page", targetRevisionId: "article-1#0001" })
        );

        expect(cancelled).toBeNull();
        expect(none).toBeNull();
        expect(otherModel).toBeNull();
    });

    it("lists every review of a target across its revisions, active or not", async () => {
        const { listTargetReviews } = await createTargetReviews();

        const reviews = expectOk(
            await listTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect(reviews.map(review => review.id).sort()).toEqual(["review-1", "review-2"]);
        expect(reviews.find(review => review.id === "review-2")?.isActive).toBe(false);
    });

    it("lists nothing for another model or an unknown target", async () => {
        const { listTargetReviews } = await createTargetReviews();

        const otherModel = expectOk(
            await listTargetReviews.execute({ model: "wb.page", targetId: "article-1" })
        );
        const unknown = expectOk(
            await listTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-9" })
        );

        expect(otherModel).toEqual([]);
        expect(unknown).toEqual([]);
    });
});

describe("Bound workflow query", () => {
    it("gets the workflow bound to a namespace, or null", async () => {
        const { context } = await createContextHandler();
        const stored = expectOk(
            await context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow: createWorkflowValues(), actor: editor })
        );
        const getBoundWorkflow = context.container.resolve(GetBoundWorkflowUseCase);

        const bound = expectOk(await getBoundWorkflow.execute({ model: ARTICLE_MODEL }));
        const unbound = expectOk(await getBoundWorkflow.execute({ model: "wb.page" }));

        expect(bound?.id).toBe(stored.id);
        expect(unbound).toBeNull();
    });
});
