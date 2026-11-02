import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createRequestedReview, expectOk, toSaveData } from "~tests/__helpers/fixtures.js";
import { inReviewData } from "~tests/__helpers/routingSeeds.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";

describe("ReviewRepository.listInReviewByOwners (R115)", () => {
    it("lists the active in-review reviews of the owners, in every namespace", async () => {
        const { context } = await createContextHandler();
        const reviews = context.container.resolve(ReviewRepository);
        expectOk(await reviews.create(inReviewData("review-a", "user-anna", "cms.article")));
        expectOk(await reviews.create(inReviewData("review-b", "user-bob", "wb.page")));
        expectOk(await reviews.create(inReviewData("review-d", "user-dan", "cms.article")));
        expectOk(
            await reviews.create({
                ...inReviewData("review-inactive", "user-anna", "cms.article"),
                isActive: false,
                state: "cancelled"
            })
        );
        expectOk(
            await reviews.create(
                toSaveData(
                    createRequestedReview({ id: "review-pool", targetRevisionId: "article-9#0001" })
                )
            )
        );

        const listed = expectOk(await reviews.listInReviewByOwners(["user-anna", "user-bob"]));

        expect(listed.map(review => review.id).sort()).toEqual(["review-a", "review-b"]);
        expect(listed.map(review => review.currentOwnerId).sort()).toEqual([
            "user-anna",
            "user-bob"
        ]);
    });

    it("answers an empty owner list with no reviews", async () => {
        const { context } = await createContextHandler();
        const reviews = context.container.resolve(ReviewRepository);
        expectOk(await reviews.create(inReviewData("review-a", "user-anna", "cms.article")));

        expect(expectOk(await reviews.listInReviewByOwners([]))).toEqual([]);
    });

    it("reads every page past 100 rows", async () => {
        const { context } = await createContextHandler();
        const reviews = context.container.resolve(ReviewRepository);
        for (let index = 0; index < 101; index++) {
            expectOk(
                await reviews.create(inReviewData(`review-${index}`, "user-anna", "cms.article"))
            );
        }
        expectOk(await reviews.create(inReviewData("review-bob", "user-bob", "cms.article")));

        const listed = expectOk(await reviews.listInReviewByOwners(["user-anna", "user-bob"]));

        expect(listed).toHaveLength(102);
        expect(new Set(listed.map(review => review.id)).size).toBe(102);
    });
});
