import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { goneAfterList, GoneAfterListReviews } from "~tests/__helpers/GoneAfterListReviews.js";
import {
    createListInput,
    createReadFilter,
    listedIds,
    type ListedReviewParams,
    seedListedReviews
} from "~tests/__helpers/listedReviews.js";
import { expectOk, otherReviewer } from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ListReviewsUseCase, type ListReviewsOutput } from "~/features/review/ListReviews/index.js";
import { ReviewListLimits } from "~/features/review/ListReviews/ReviewListLimits.js";
import { decodeReviewListCursor } from "~/features/review/ListReviews/reviewListCursor.js";

/** Pages of 3 rows and at most 5 rows examined per call, so a few rows cross every boundary. */
const SMALL_LIMITS: ReviewListLimits.Interface = { pageSize: 3, maxScan: 5 };

/** The folder the viewer cannot read in these tests. */
const LOCKED_FOLDER = "folder-locked";

const createPagingContext = async (reviews: ListedReviewParams[], gone: string[] = []) => {
    goneAfterList.clear();
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(GoneAfterListReviews);
        }
    });
    context.container.registerInstance(ReviewListLimits, SMALL_LIMITS);
    await seedListedReviews(context.container.resolve(ReviewRepository), reviews);
    for (const id of gone) {
        goneAfterList.add(id);
    }
    return context.container.resolve(ListReviewsUseCase);
};

/** Pool rows `<prefix>01..<prefix>n`, one minute apart (CMS entry ids need 3+ characters). */
const poolRows = (prefix: string, count: number, locked: string[] = []): ListedReviewParams[] => {
    return Array.from({ length: count }, (_, index) => {
        const id = `${prefix}${String(index + 1).padStart(2, "0")}`;
        const row: ListedReviewParams = { id, minute: index + 1 };
        if (locked.includes(id)) {
            row.folderId = LOCKED_FOLDER;
        }
        return row;
    });
};

const readFilter = createReadFilter({ deniedFolderIds: [LOCKED_FOLDER] });

describe("ListReviewsUseCase paging (D76, R92)", () => {
    it("leaves out reviews in a denied folder and still fills the page", async () => {
        const listReviews = await createPagingContext(poolRows("p", 6, ["p02", "p04"]));

        const first = expectOk(
            await listReviews.execute(createListInput({ limit: 3, readFilter }))
        );
        const second = expectOk(
            await listReviews.execute(
                createListInput({ limit: 3, readFilter, after: first.meta.cursor })
            )
        );

        expect(listedIds(first)).toEqual(["p01", "p03", "p05"]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(listedIds(second)).toEqual(["p06"]);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("skips listed reviews the confirm drops and still fills the page (R18)", async () => {
        const listReviews = await createPagingContext(poolRows("g", 6), ["g02", "g04"]);

        const first = expectOk(await listReviews.execute(createListInput({ limit: 3 })));
        const second = expectOk(
            await listReviews.execute(createListInput({ limit: 3, after: first.meta.cursor }))
        );

        expect(listedIds(first)).toEqual(["g01", "g03", "g05"]);
        expect(listedIds(second)).toEqual(["g06"]);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("returns every matching review exactly once across pages when rows are left out", async () => {
        const listReviews = await createPagingContext(
            [
                ...poolRows("q", 10, ["q03", "q09"]),
                // Not in the pool: filtered out, never returned.
                { id: "n01", minute: 11, stepState: "inReview", ownerId: otherReviewer.id },
                { id: "n02", minute: 12, stepState: "inReview", ownerId: otherReviewer.id }
            ],
            ["q06"]
        );

        const seen: string[] = [];
        let after: string | null = null;
        let calls = 0;
        do {
            const page: ListReviewsOutput = expectOk(
                await listReviews.execute(createListInput({ limit: 2, readFilter, after }))
            );
            seen.push(...listedIds(page));
            after = page.meta.hasMoreItems ? page.meta.cursor : null;
            calls++;
        } while (after && calls < 20);

        expect(seen).toEqual(["q01", "q02", "q04", "q05", "q07", "q08", "q10"]);
        expect(new Set(seen).size).toBe(seen.length);
    });

    it("stops at the scan cap with hasMoreItems true when the confirm drops rows, and resumes from the cursor", async () => {
        const rows = poolRows("s", 8);
        const gone = rows.map(row => row.id).filter(id => id !== "s07");
        const listReviews = await createPagingContext(rows, gone);

        const first = expectOk(await listReviews.execute(createListInput()));
        const second = expectOk(
            await listReviews.execute(createListInput({ after: first.meta.cursor }))
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
