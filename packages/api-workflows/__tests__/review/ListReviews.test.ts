import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createListedReview,
    createListInput,
    listedIds,
    type ListedReviewParams,
    seedListedReviews
} from "~tests/__helpers/listedReviews.js";
import {
    ARTICLE_MODEL,
    expectOk,
    OTHER_TEAM_ID,
    otherReviewer,
    reviewer
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData, ReviewListKind } from "~/domain/review/types.js";
import { ListReviewsUseCase } from "~/features/review/ListReviews/index.js";
import { ReviewListLimits } from "~/features/review/ListReviews/ReviewListLimits.js";
import { decodeReviewListCursor } from "~/features/review/ListReviews/reviewListCursor.js";

const createStorageContext = async (reviews: ListedReviewParams[]) => {
    const { context } = await createContextHandler();
    await seedListedReviews(context.container.resolve(ReviewRepository), reviews);
    return context.container.resolve(ListReviewsUseCase);
};

interface MemoryRepositoryOptions {
    /** Listed, but gone from primary storage (R18). */
    missingIds?: string[];
    failList?: boolean;
    failGetId?: string;
    /** What primary storage holds now for these ids, instead of the listed row (R18). */
    primaryRows?: ReviewData[];
    /** Every page after the first answers with the cursor it was asked with. */
    repeatCursor?: boolean;
    limits?: ReviewListLimits.Interface;
}

interface MemoryCalls {
    list: number;
    get: number;
}

/** In-memory repository: pages by offset, ignores the where (rows are built to match). */
const createMemoryContext = async (
    reviews: ReviewData[],
    options: MemoryRepositoryOptions = {}
) => {
    const calls: MemoryCalls = { list: 0, get: 0 };
    const repository: ReviewRepository.Interface = {
        get: async id => {
            calls.get++;
            if (id === options.failGetId) {
                return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
            }
            const review =
                options.primaryRows?.find(item => item.id === id) ??
                reviews.find(item => item.id === id);
            if (!review || options.missingIds?.includes(id)) {
                return Result.fail(new ReviewNotFoundError({ id }));
            }
            return Result.ok(review);
        },
        getActiveByTarget: async () => Result.ok(null),
        countInProgressByWorkflow: async () => Result.ok(0),
        listInProgressByWorkflow: async () => Result.ok([]),
        listByTarget: async () => Result.ok([]),
        listInReviewByOwners: async () => Result.ok([]),
        create: async review => Result.ok(review),
        update: async review => Result.ok(review),
        delete: async () => Result.ok(),
        list: async params => {
            calls.list++;
            if (options.failList) {
                return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
            }
            const start = params.after ? Number(params.after) : 0;
            const end = start + params.limit;
            const hasMoreItems = end < reviews.length;
            return Result.ok({
                items: reviews.slice(start, end),
                meta: {
                    cursor: hasMoreItems
                        ? options.repeatCursor && params.after
                            ? params.after
                            : String(end)
                        : null,
                    hasMoreItems,
                    totalCount: reviews.length
                }
            });
        }
    };
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ReviewRepository, repository);
            if (options.limits) {
                container.registerInstance(ReviewListLimits, options.limits);
            }
        }
    });
    return {
        calls,
        listReviews: context.container.resolve(ListReviewsUseCase)
    };
};

/** `count` pool rows that every list call keeps. */
const poolRows = (count: number): ReviewData[] => {
    return Array.from({ length: count }, (_, index) =>
        createListedReview({ id: `pool-${index + 1}`, minute: index % 60 })
    );
};

/** What makes a seeded review match each list for the `reviewer` viewer. */
const MATCHING: Record<ReviewListKind, Partial<ListedReviewParams>> = {
    assignedToMe: { stepState: "inReview", ownerId: reviewer.id },
    pool: { stepState: "awaiting" },
    teamInReview: { stepState: "inReview", ownerId: otherReviewer.id },
    myRequests: { requester: reviewer },
    failedSteps: { stepState: "failed", stepType: "ai" }
};

const ALL_LISTS: ReviewListKind[] = [
    "assignedToMe",
    "pool",
    "teamInReview",
    "myRequests",
    "failedSteps"
];

describe("ListReviewsUseCase lists (spec 11, R91)", () => {
    it("lists the viewer's in-review reviews in assignedToMe, oldest change first", async () => {
        const listReviews = await createStorageContext([
            { id: "a01", minute: 3, stepState: "inReview", ownerId: reviewer.id },
            { id: "a02", minute: 1, stepState: "inReview", ownerId: reviewer.id },
            { id: "a03", minute: 2, stepState: "inReview", ownerId: otherReviewer.id },
            { id: "a04", minute: 4, stepState: "awaiting" },
            {
                id: "a05",
                minute: 5,
                stepState: "inReview",
                ownerId: reviewer.id,
                isActive: false,
                state: "cancelled"
            },
            {
                id: "a06",
                minute: 6,
                stepState: "inReview",
                ownerId: reviewer.id,
                model: "cms.other"
            }
        ]);

        const result = expectOk(
            await listReviews.execute(createListInput({ list: "assignedToMe" }))
        );

        expect(listedIds(result)).toEqual(["a02", "a01"]);
        expect(result.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("lists awaiting reviews of the viewer's teams in pool, without the viewer's own requests", async () => {
        const listReviews = await createStorageContext([
            { id: "p01", minute: 1 },
            { id: "p02", minute: 2, teamIds: [OTHER_TEAM_ID] },
            { id: "p03", minute: 3, requester: reviewer },
            { id: "p04", minute: 4, teamIds: [OTHER_TEAM_ID, "team-reviewers"] },
            { id: "p05", minute: 5, stepState: "inReview", ownerId: otherReviewer.id }
        ]);

        const result = expectOk(await listReviews.execute(createListInput({ list: "pool" })));

        expect(listedIds(result)).toEqual(["p01", "p04"]);
    });

    it("lists the viewer's teams' reviews held by someone else in teamInReview", async () => {
        const listReviews = await createStorageContext([
            { id: "t01", minute: 1, stepState: "inReview", ownerId: otherReviewer.id },
            { id: "t02", minute: 2, stepState: "inReview", ownerId: reviewer.id },
            {
                id: "t03",
                minute: 3,
                stepState: "inReview",
                ownerId: otherReviewer.id,
                teamIds: [OTHER_TEAM_ID]
            },
            { id: "t04", minute: 4, stepState: "awaiting" }
        ]);

        const result = expectOk(
            await listReviews.execute(createListInput({ list: "teamInReview" }))
        );

        expect(listedIds(result)).toEqual(["t01"]);
    });

    it("lists the viewer's active requests in myRequests, newest change first, with state filters", async () => {
        const listReviews = await createStorageContext([
            { id: "m01", minute: 1, requester: reviewer },
            { id: "m02", minute: 2, requester: otherReviewer },
            {
                id: "m03",
                minute: 3,
                requester: reviewer,
                state: "approved",
                stepState: "approved"
            },
            {
                id: "m04",
                minute: 4,
                requester: reviewer,
                isActive: false,
                state: "cancelled",
                stepState: null
            }
        ]);

        const all = expectOk(await listReviews.execute(createListInput({ list: "myRequests" })));
        const approved = expectOk(
            await listReviews.execute(
                createListInput({ list: "myRequests", where: { reviewState: "approved" } })
            )
        );
        const awaiting = expectOk(
            await listReviews.execute(
                createListInput({ list: "myRequests", where: { stepState: "awaiting" } })
            )
        );

        expect(listedIds(all)).toEqual(["m03", "m01"]);
        expect(listedIds(approved)).toEqual(["m03"]);
        expect(listedIds(awaiting)).toEqual(["m01"]);
    });

    it("lists failed AI and automation steps in failedSteps", async () => {
        const listReviews = await createStorageContext([
            { id: "f01", minute: 1, stepState: "failed", stepType: "ai" },
            { id: "f02", minute: 2, stepState: "failed", stepType: "automation" },
            { id: "f03", minute: 3, stepState: "failed", stepType: "review" },
            { id: "f04", minute: 4, stepState: "awaiting", stepType: "ai" }
        ]);

        const result = expectOk(
            await listReviews.execute(createListInput({ list: "failedSteps" }))
        );

        expect(listedIds(result)).toEqual(["f01", "f02"]);
    });

    it.each(ALL_LISTS)("filters %s by a part of the title", async list => {
        const listReviews = await createStorageContext([
            { id: "x01", minute: 1, title: "Spring LAUNCH", ...MATCHING[list] },
            { id: "x02", minute: 2, title: "Autumn sale", ...MATCHING[list] }
        ]);

        const all = expectOk(await listReviews.execute(createListInput({ list })));
        const filtered = expectOk(
            await listReviews.execute(createListInput({ list, where: { titleContains: "launch" } }))
        );

        expect(listedIds(all).sort()).toEqual(["x01", "x02"]);
        expect(listedIds(filtered)).toEqual(["x01"]);
    });

    it("takes either sort direction (D119)", async () => {
        const listReviews = await createStorageContext([
            { id: "s01", minute: 1 },
            { id: "s02", minute: 2 },
            { id: "m01", minute: 3, requester: reviewer },
            { id: "m02", minute: 4, requester: reviewer }
        ]);

        const poolDescending = expectOk(
            await listReviews.execute(createListInput({ list: "pool", sort: "lastChangedOn_DESC" }))
        );
        const myRequestsAscending = expectOk(
            await listReviews.execute(
                createListInput({ list: "myRequests", sort: "lastChangedOn_ASC" })
            )
        );

        // m1 and m2 are the viewer's own requests, so the pool leaves them out.
        expect(listedIds(poolDescending)).toEqual(["s02", "s01"]);
        expect(listedIds(myRequestsAscending)).toEqual(["m01", "m02"]);
    });

    it("lists only the given namespaces", async () => {
        const listReviews = await createStorageContext([
            { id: "n01", minute: 1 },
            { id: "n02", minute: 2, model: "wb.page" },
            { id: "n03", minute: 3, model: "cms.other" }
        ]);

        const both = expectOk(
            await listReviews.execute(createListInput({ models: [ARTICLE_MODEL, "wb.page"] }))
        );
        const pages = expectOk(await listReviews.execute(createListInput({ models: ["wb.page"] })));

        expect(listedIds(both)).toEqual(["n01", "n02"]);
        expect(listedIds(pages)).toEqual(["n02"]);
    });
});

describe("ListReviewsUseCase input rules (R91, R92)", () => {
    it.each(["assignedToMe", "pool", "teamInReview", "failedSteps"] as ReviewListKind[])(
        "rejects reviewState and stepState outside myRequests: %s",
        async list => {
            const { listReviews, calls } = await createMemoryContext(poolRows(1));

            const byReviewState = await listReviews.execute(
                createListInput({ list, where: { reviewState: "approved" } })
            );
            const byStepState = await listReviews.execute(
                createListInput({ list, where: { stepState: "awaiting" } })
            );

            for (const result of [byReviewState, byStepState]) {
                expect(result.isFail()).toBe(true);
                expect(result.error.code).toBe("Workflows/Review/Validation");
                expect(result.error.message).toBe(
                    "The review and step state filters apply only to the my requests list."
                );
            }
            expect(calls.list).toBe(0);
        }
    );

    it("returns an empty page without a query for no models, or no teams in pool and teamInReview", async () => {
        const { listReviews, calls } = await createMemoryContext(poolRows(3));

        const noModels = expectOk(await listReviews.execute(createListInput({ models: [] })));
        const noTeamsPool = expectOk(
            await listReviews.execute(createListInput({ list: "pool", viewerTeamIds: [] }))
        );
        const noTeamsInReview = expectOk(
            await listReviews.execute(createListInput({ list: "teamInReview", viewerTeamIds: [] }))
        );

        for (const result of [noModels, noTeamsPool, noTeamsInReview]) {
            expect(result).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
        }
        expect(calls.list).toBe(0);
    });

    it("fails an invalid cursor with a validation error and no query", async () => {
        const { listReviews, calls } = await createMemoryContext(poolRows(3));
        const malformed = Buffer.from(JSON.stringify({ after: 5, skip: 0 })).toString("base64");

        for (const after of ["not-a-cursor", malformed]) {
            const result = await listReviews.execute(createListInput({ after }));

            expect(result.error.code).toBe("Workflows/Review/Validation");
            expect(result.error.message).toBe("The list cursor is invalid.");
        }
        expect(calls.list).toBe(0);
    });

    it("returns 20 rows by default and at most 100", async () => {
        const { listReviews } = await createMemoryContext(poolRows(150));

        const byDefault = expectOk(await listReviews.execute(createListInput()));
        const clamped = expectOk(await listReviews.execute(createListInput({ limit: 500 })));

        expect(byDefault.items).toHaveLength(20);
        expect(byDefault.meta.hasMoreItems).toBe(true);
        expect(clamped.items).toHaveLength(100);
        expect(clamped.meta.hasMoreItems).toBe(true);
    });

    it("guards a non-integer limit: NaN takes the default, 2.5 rounds down", async () => {
        const { listReviews } = await createMemoryContext(poolRows(150));

        const notANumber = expectOk(await listReviews.execute(createListInput({ limit: NaN })));
        const fraction = expectOk(await listReviews.execute(createListInput({ limit: 2.5 })));
        const zero = expectOk(await listReviews.execute(createListInput({ limit: 0 })));

        expect(notANumber.items).toHaveLength(20);
        expect(listedIds(fraction)).toEqual(["pool-1", "pool-2"]);
        expect(zero.items).toHaveLength(1);
    });

    it("guards an infinite limit as the default and a negative limit as 1", async () => {
        const { listReviews } = await createMemoryContext(poolRows(150));

        const infinite = expectOk(await listReviews.execute(createListInput({ limit: Infinity })));
        const negative = expectOk(await listReviews.execute(createListInput({ limit: -5 })));

        expect(infinite.items).toHaveLength(20);
        expect(negative.items).toHaveLength(1);
    });

    it("stops at a repository page boundary with { after: next, skip: 0 } and resumes at the next row", async () => {
        // Default page size 50: 100 rows end exactly on the second page.
        const { listReviews } = await createMemoryContext(poolRows(150));

        const first = expectOk(await listReviews.execute(createListInput({ limit: 100 })));
        const second = expectOk(
            await listReviews.execute(createListInput({ limit: 100, after: first.meta.cursor }))
        );

        expect(listedIds(first).at(-1)).toBe("pool-100");
        expect(decodeReviewListCursor(first.meta.cursor ?? "")).toEqual({ after: "100", skip: 0 });
        expect(listedIds(second)[0]).toBe("pool-101");
        expect(second.items).toHaveLength(50);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("ends the list when the repository repeats its cursor", async () => {
        const { listReviews, calls } = await createMemoryContext(poolRows(9), {
            repeatCursor: true,
            limits: { pageSize: 3, maxScan: 200 }
        });

        const result = expectOk(await listReviews.execute(createListInput()));

        // Page 1 answers cursor "3"; page 2, asked with "3", answers "3" again.
        expect(listedIds(result)).toEqual([
            "pool-1",
            "pool-2",
            "pool-3",
            "pool-4",
            "pool-5",
            "pool-6"
        ]);
        expect(result.meta).toEqual({ cursor: null, hasMoreItems: false });
        expect(calls.list).toBe(2);
    });

    it("skips a listed row whose primary row no longer matches, counts it and never asks canRead (R18)", async () => {
        const rows = poolRows(6);
        const { listReviews, calls } = await createMemoryContext(rows, {
            primaryRows: [
                // Taken since it was listed: no longer awaiting.
                createListedReview({
                    id: "pool-2",
                    minute: 1,
                    stepState: "inReview",
                    ownerId: otherReviewer.id
                }),
                // Now the viewer's own request: the pool leaves it out.
                createListedReview({ id: "pool-3", minute: 2, requester: reviewer })
            ],
            limits: { pageSize: 3, maxScan: 3 }
        });
        const asked: string[] = [];

        const result = expectOk(
            await listReviews.execute(
                createListInput({
                    canRead: async review => {
                        asked.push(review.id);
                        return true;
                    }
                })
            )
        );

        expect(listedIds(result)).toEqual(["pool-1"]);
        expect(asked).toEqual(["pool-1"]);
        // Three rows examined hit the cap: pool-4 is left for the next call.
        expect(calls.get).toBe(3);
        expect(result.meta.hasMoreItems).toBe(true);
        expect(decodeReviewListCursor(result.meta.cursor ?? "")).toEqual({ after: "3", skip: 0 });
    });

    it("skips a listed review that is gone from primary storage (R18)", async () => {
        const { listReviews } = await createMemoryContext(poolRows(3), {
            missingIds: ["pool-2"]
        });

        const result = expectOk(await listReviews.execute(createListInput()));

        expect(listedIds(result)).toEqual(["pool-1", "pool-3"]);
    });

    it("fails with the persistence error when the list or a primary read fails", async () => {
        const listFails = await createMemoryContext(poolRows(3), { failList: true });
        const getFails = await createMemoryContext(poolRows(3), { failGetId: "pool-2" });

        const listed = await listFails.listReviews.execute(createListInput());
        const read = await getFails.listReviews.execute(createListInput());

        expect(listed.error.code).toBe("Workflows/Review/Persistence");
        expect(read.error.code).toBe("Workflows/Review/Persistence");
    });
});
