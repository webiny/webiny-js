import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createListInput,
    listedIds,
    type ListedReviewParams,
    seedListedReviews
} from "~tests/__helpers/listedReviews.js";
import { expectOk, otherReviewer } from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ListReviewsUseCase, type ListReviewsOutput } from "~/features/review/ListReviews/index.js";
import { ReviewListLimits } from "~/features/review/ListReviews/ReviewListLimits.js";
import { decodeReviewListCursor } from "~/features/review/ListReviews/reviewListCursor.js";

/** Pages of 3 rows and at most 5 rows examined per call, so a few rows cross every boundary. */
const SMALL_LIMITS: ReviewListLimits.Interface = { pageSize: 3, maxScan: 5 };

const createPagingContext = async (reviews: ListedReviewParams[]) => {
    const { context } = await createContextHandler();
    context.container.registerInstance(ReviewListLimits, SMALL_LIMITS);
    await seedListedReviews(context.container.resolve(ReviewRepository), reviews);
    return context.container.resolve(ListReviewsUseCase);
};

/** Pool rows `<prefix>01..<prefix>n`, one minute apart (CMS entry ids need 3+ characters). */
const poolRows = (prefix: string, count: number): ListedReviewParams[] => {
    return Array.from({ length: count }, (_, index) => ({
        id: `${prefix}${String(index + 1).padStart(2, "0")}`,
        minute: index + 1
    }));
};

const readableExcept = (ids: string[]) => {
    return async (review: ReviewData) => !ids.includes(review.id);
};

describe("ListReviewsUseCase paging (D76, R92)", () => {
    it("skips reviews the predicate rejects and still fills the page", async () => {
        const listReviews = await createPagingContext(poolRows("p", 6));
        const canRead = readableExcept(["p02", "p04"]);

        const first = expectOk(await listReviews.execute(createListInput({ limit: 3, canRead })));
        const second = expectOk(
            await listReviews.execute(
                createListInput({ limit: 3, canRead, after: first.meta.cursor })
            )
        );

        expect(listedIds(first)).toEqual(["p01", "p03", "p05"]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(listedIds(second)).toEqual(["p06"]);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("counts a throwing predicate as unreadable", async () => {
        const listReviews = await createPagingContext(poolRows("p", 3));

        const result = expectOk(
            await listReviews.execute(
                createListInput({
                    canRead: async review => {
                        if (review.id === "p02") {
                            throw new Error("Target read failed.");
                        }
                        return true;
                    }
                })
            )
        );

        expect(listedIds(result)).toEqual(["p01", "p03"]);
    });

    it("returns every matching review exactly once across pages when the predicate skips rows", async () => {
        const listReviews = await createPagingContext([
            ...poolRows("q", 10),
            // Not in the pool: filtered out, never returned.
            { id: "n01", minute: 11, stepState: "inReview", ownerId: otherReviewer.id },
            { id: "n02", minute: 12, stepState: "inReview", ownerId: otherReviewer.id }
        ]);
        const canRead = readableExcept(["q03", "q06", "q09"]);

        const seen: string[] = [];
        let after: string | null = null;
        let calls = 0;
        do {
            const page: ListReviewsOutput = expectOk(
                await listReviews.execute(createListInput({ limit: 2, canRead, after }))
            );
            seen.push(...listedIds(page));
            after = page.meta.hasMoreItems ? page.meta.cursor : null;
            calls++;
        } while (after && calls < 20);

        expect(seen).toEqual(["q01", "q02", "q04", "q05", "q07", "q08", "q10"]);
        expect(new Set(seen).size).toBe(seen.length);
    });

    it("stops at the scan cap with hasMoreItems true and resumes from the cursor", async () => {
        const listReviews = await createPagingContext(poolRows("s", 8));
        const canRead = async (review: ReviewData) => review.id === "s07";

        const first = expectOk(await listReviews.execute(createListInput({ canRead })));
        const second = expectOk(
            await listReviews.execute(createListInput({ canRead, after: first.meta.cursor }))
        );

        // s1..s5 examined: the cap stops on the third row of the second repository page.
        expect(first.items).toEqual([]);
        expect(first.meta.hasMoreItems).toBe(true);
        const cursor = decodeReviewListCursor(first.meta.cursor ?? "");
        expect(cursor?.ids).toEqual(["s05"]);
        expect(listedIds(second)).toEqual(["s07"]);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });
});
