import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createListedReview } from "~tests/__helpers/listedReviews.js";
import { ARTICLE_MODEL, expectOk } from "~tests/__helpers/fixtures.js";
import {
    cmsEntryReads,
    countCmsEntryReads,
    resetCmsEntryReads
} from "~tests/__helpers/CountingCmsEntryReads.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ListReviewedModelsUseCase } from "~/features/review/ListReviewedModels/index.js";

interface TargetReviewParams {
    id: string;
    targetId: string;
    minute: number;
    model?: string;
    revision?: number;
    isActive?: boolean;
}

/** A review of a target revision; revision 1 unless given. */
const createTargetReview = (params: TargetReviewParams): ReviewData => {
    const revision = String(params.revision ?? 1).padStart(4, "0");
    const review = createListedReview({
        id: params.id,
        minute: params.minute,
        model: params.model,
        isActive: params.isActive
    });
    return {
        ...review,
        targetId: params.targetId,
        targetRevisionId: `${params.targetId}#${revision}`
    };
};

const createSeededContext = async (reviews: ReviewData[]) => {
    const { context } = await createContextHandler({ setup: countCmsEntryReads });
    const repository = context.container.resolve(ReviewRepository);
    for (const review of reviews) {
        expectOk(await repository.create(review));
    }
    resetCmsEntryReads();
    return context;
};

const createRepository = async (reviews: ReviewData[]) => {
    const context = await createSeededContext(reviews);
    return context.container.resolve(ReviewRepository);
};

const ids = (reviews: ReviewData[]): string[] => {
    return reviews.map(review => review.id);
};

describe("ReviewRepository batch reads (Q78)", () => {
    beforeEach(() => {
        resetCmsEntryReads();
    });

    it("getMany reads reviews in one batch, in the order asked, leaving out missing ids", async () => {
        const repository = await createRepository([
            createTargetReview({ id: "gm1", targetId: "art-1", minute: 1 }),
            createTargetReview({ id: "gm2", targetId: "art-2", minute: 2 }),
            createTargetReview({ id: "gm3", targetId: "art-3", minute: 3 })
        ]);

        const found = expectOk(await repository.getMany(["gm3", "missing", "gm1", "gm3"]));
        const none = expectOk(await repository.getMany([]));

        expect(ids(found)).toEqual(["gm3", "gm1"]);
        expect(found[0].targetId).toBe("art-3");
        expect(none).toEqual([]);
        expect(cmsEntryReads).toEqual({
            listLatestEntries: 0,
            getEntriesByIds: 1,
            getEntryById: 0,
            getRevisionById: 0,
            getUniqueFieldValues: 0
        });
    });

    it("listByTargets returns every review of the given targets of one model", async () => {
        const repository = await createRepository([
            createTargetReview({ id: "lt1", targetId: "art-1", minute: 1 }),
            createTargetReview({ id: "lt2", targetId: "art-1", minute: 2, revision: 2 }),
            createTargetReview({ id: "lt3", targetId: "art-2", minute: 3, isActive: false }),
            createTargetReview({ id: "lt4", targetId: "art-3", minute: 4 }),
            createTargetReview({ id: "lt5", targetId: "art-1", minute: 5, model: "wb.page" })
        ]);

        const listed = expectOk(
            await repository.listByTargets({
                model: ARTICLE_MODEL,
                targetIds: ["art-1", "art-2", "art-9"]
            })
        );
        const none = expectOk(
            await repository.listByTargets({ model: ARTICLE_MODEL, targetIds: [] })
        );

        expect(ids(listed).sort()).toEqual(["lt1", "lt2", "lt3"]);
        expect(none).toEqual([]);
        // One query and one batch read for the one chunk; none for no targets.
        expect(cmsEntryReads).toEqual({
            listLatestEntries: 1,
            getEntriesByIds: 1,
            getEntryById: 0,
            getRevisionById: 0,
            getUniqueFieldValues: 0
        });
    });

    it("listByTargets makes one query per 100 targets, whatever the number of reviews", async () => {
        const targetIds = Array.from({ length: 150 }, (_, index) => `art-${index + 1}`);
        const reviews = [3, 120, 140].map((targetIndex, index) => {
            return createTargetReview({
                id: `ch${index + 1}`,
                targetId: targetIds[targetIndex],
                minute: index + 1
            });
        });
        const repository = await createRepository(reviews);

        const listed = expectOk(
            await repository.listByTargets({ model: ARTICLE_MODEL, targetIds })
        );

        expect(ids(listed).sort()).toEqual(["ch1", "ch2", "ch3"]);
        expect(cmsEntryReads.listLatestEntries).toBe(2);
        expect(cmsEntryReads.getEntriesByIds).toBe(2);
        expect(cmsEntryReads.getEntryById).toBe(0);
    });

    it("listByTarget and getActiveByTarget confirm their hits with one batch read", async () => {
        const repository = await createRepository([
            createTargetReview({ id: "one1", targetId: "art-1", minute: 1, isActive: false }),
            createTargetReview({ id: "one2", targetId: "art-1", minute: 2 }),
            createTargetReview({ id: "one3", targetId: "art-1", minute: 3, revision: 2 }),
            createTargetReview({ id: "one4", targetId: "art-2", minute: 4 })
        ]);

        const all = expectOk(
            await repository.listByTarget({ model: ARTICLE_MODEL, targetId: "art-1" })
        );
        const firstRevision = expectOk(
            await repository.listByTarget({
                model: ARTICLE_MODEL,
                targetId: "art-1",
                targetRevisionId: "art-1#0001"
            })
        );
        const listReads = { ...cmsEntryReads };
        resetCmsEntryReads();
        const active = expectOk(
            await repository.getActiveByTarget({
                model: ARTICLE_MODEL,
                targetRevisionId: "art-1#0001"
            })
        );

        expect(ids(all).sort()).toEqual(["one1", "one2", "one3"]);
        expect(ids(firstRevision).sort()).toEqual(["one1", "one2"]);
        expect(listReads).toEqual({
            listLatestEntries: 2,
            getEntriesByIds: 2,
            getEntryById: 0,
            getRevisionById: 0,
            getUniqueFieldValues: 0
        });
        expect(active?.id).toBe("one2");
        expect(cmsEntryReads).toEqual({
            listLatestEntries: 1,
            getEntriesByIds: 1,
            getEntryById: 0,
            getRevisionById: 0,
            getUniqueFieldValues: 0
        });
    });

    it("lists the namespaces of active reviews with one query, cached for the request", async () => {
        const context = await createSeededContext([
            createTargetReview({ id: "am1", targetId: "art-1", minute: 1 }),
            createTargetReview({ id: "am2", targetId: "art-2", minute: 2 }),
            createTargetReview({ id: "am3", targetId: "pg-1", minute: 3, model: "wb.page" }),
            createTargetReview({
                id: "am4",
                targetId: "oth-1",
                minute: 4,
                model: "cms.other",
                isActive: false
            })
        ]);
        const repository = context.container.resolve(ReviewRepository);
        const useCase = context.container.resolve(ListReviewedModelsUseCase);

        const models = expectOk(await repository.listReviewedModels());
        resetCmsEntryReads();
        const first = expectOk(await useCase.execute());
        const second = expectOk(
            await context.container.resolve(ListReviewedModelsUseCase).execute()
        );

        // "cms.other" has only a cancelled (inactive) review, which no list returns.
        expect(models.sort()).toEqual([ARTICLE_MODEL, "wb.page"]);
        expect(first.sort()).toEqual([ARTICLE_MODEL, "wb.page"]);
        expect(second.sort()).toEqual([ARTICLE_MODEL, "wb.page"]);
        expect(cmsEntryReads.getUniqueFieldValues).toBe(1);
    });
});
