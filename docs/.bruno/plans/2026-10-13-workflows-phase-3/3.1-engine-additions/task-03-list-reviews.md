### Task 3: `ListReviewsUseCase`: five lists, predicate, cursor, scan cap

Spec 11, D47, D76, D94, D112, D119, D132, R18, R91, R92, A40, A41, A42. One internal use case serves all five lists of every app. The app wrapper (3.3 / 3.4) passes the viewer ids, the namespace ids it lists and a `canRead` predicate; the engine checks nothing else (D132).

How a call works:

1. `where.reviewState` / `where.stepState` outside `myRequests` fail with `ReviewValidationError` (D94, R91). An invalid `after` fails with `ReviewValidationError("The list cursor is invalid.")` (R92).
2. No `models`, or `pool` / `teamInReview` with no `viewerTeamIds`, answer an empty page without a query (R91).
3. `limit` defaults to 20 and is clamped to 1..100; `sort` defaults to `lastChangedOn_DESC` for `myRequests` and `lastChangedOn_ASC` otherwise (D119).
4. The use case pages `ReviewRepository.list` (new) with a storage pre-filter built by the pure `createReviewListWhere`, sorted by `values_lastChangedOn_ASC|DESC`, `ReviewListLimits.pageSize` rows per page (default 50; constant, so a cursor's `skip` stays valid).
5. Each examined row is confirmed with a primary-storage `ReviewRepository.get` (R18: the list index can be stale on ddb-os; a row deleted since it was listed is skipped), checked against every list condition in code by the pure `matchesReviewList`, and then passed to `canRead` (a throw counts as unreadable).
6. It stops when `limit` rows are kept or `ReviewListLimits.maxScan` rows were examined (default `MAX_REVIEW_LIST_SCAN = 200`, A41). The cursor is base64 JSON `{ after, skip }`: the repository cursor of the page being read and how many of its rows were examined, so the next call resumes at the next row, also mid page (R92). `meta = { cursor, hasMoreItems }`, no `totalCount` (D76). The cursor is valid only with the same list, where and sort, and exact only while the data does not change: on ddb the CMS cursor is an offset, so a row that leaves the list between calls can make the next call skip one row (A41, accepted).

**Which conditions run in code (A40).** Every list condition runs in code on the primary-storage row (`matchesReviewList`), because the index row can be stale (R18). Every condition is also sent to storage as a pre-filter, so few rows are examined:

| List | Condition | Storage pre-filter (`ReviewRepository.ListWhere` → CMS `where.values`) | In code (`matchesReviewList`) |
|---|---|---|---|
| all | namespace | `model_in` → `model_in` | yes |
| all | active | `isActive: true` → `isActive` | yes |
| all | title | `title_contains` → `title_contains` | yes (case-insensitive, every word anywhere, like storage) |
| assignedToMe | owner is viewer, in review | `currentOwnerId`, `currentStepState` | yes |
| pool | awaiting, shares a team, not own request | `currentStepState`, `currentCandidateTeamIds_in` → `currentCandidateTeamIds_in`, `requesterId_not` → `requester: { id_not }` | yes |
| teamInReview | in review, owner not viewer, shares a team | `currentStepState`, `currentOwnerId_not` → `currentOwnerId_not`, `currentCandidateTeamIds_in` | yes |
| myRequests | requester is viewer, optional states | `requesterId` → `requester: { id }`, `state`, `currentStepState` | yes |
| failedSteps | failed, AI or automation | `currentStepState`, `currentStepType_in` → `currentStepType_in` | yes |

A40 doubted `currentOwnerId_not`, `currentCandidateTeamIds_in` and the nested `requester.id` / `requester.id_not`. `__tests__/review/ReviewRepositoryList.test.ts` measures each pre-filter key alone on both storages (`yarn test` and `yarn test:os`). If a key fails there on a storage, remove that key from `ReviewRepository.list`'s CMS mapping (Step 5), keep `matchesReviewList` unchanged (it already enforces it), delete that key's row from the repository test, and record in the task report which key now runs only in code. The use case tests must pass unchanged either way.

Default page size: 50 rows. A42's bound holds: at most `maxScan` primary reads plus `maxScan` predicate calls per call; the index pages read are at most `maxScan / pageSize + 2`.

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Create: `packages/api-workflows/src/domain/review/matchesReviewList.ts`
- Modify: `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`
- Create: `packages/api-workflows/src/features/review/ListReviews/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ListReviews/ReviewListLimits.ts`
- Create: `packages/api-workflows/src/features/review/ListReviews/DefaultReviewListLimits.ts`
- Create: `packages/api-workflows/src/features/review/ListReviews/createReviewListWhere.ts`
- Create: `packages/api-workflows/src/features/review/ListReviews/reviewListCursor.ts`
- Create: `packages/api-workflows/src/features/review/ListReviews/ListReviewsUseCase.ts`
- Create: `packages/api-workflows/src/features/review/ListReviews/feature.ts`
- Create: `packages/api-workflows/src/features/review/ListReviews/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/listedReviews.ts`
- Test: `packages/api-workflows/__tests__/review/reviewListCursor.test.ts`
- Test: `packages/api-workflows/__tests__/review/ReviewRepositoryList.test.ts`
- Test: `packages/api-workflows/__tests__/review/ListReviews.test.ts`
- Test: `packages/api-workflows/__tests__/review/ListReviewsPaging.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`


**Interfaces:**
- Consumes: `ReviewRepository.get(id)` (`ReviewNotFoundError | ReviewPersistenceError`), `ListLatestEntriesUseCase.execute<ReviewEntryValues>(model, { where: { values }, sort, limit, after })`, `ReviewEntryMapper.fromEntry`, `ReviewValidationError`, `ReviewData.currentStepType` (Task 1), `CmsEntryListWhereValues`, `CmsEntryMeta`.
- Produces (3.3 / 3.4 consume these names exactly):
  - In `domain/review/types.ts`: `type ReviewListKind = "assignedToMe" | "pool" | "teamInReview" | "myRequests" | "failedSteps"`, `type ReviewListSort = "lastChangedOn_ASC" | "lastChangedOn_DESC"`, `interface ReviewListWhere { titleContains?: string | null; reviewState?: ReviewState | null; stepState?: StepState | null }`, `interface ReviewListMeta { cursor: string | null; hasMoreItems: boolean }`.
  - `ListReviewsUseCase` (`features/review/ListReviews/index.js`): `execute(input: ListReviewsInput): Promise<Result<ListReviewsOutput, ListReviewsUseCase.Error>>`; errors `Workflows/Review/Validation`, `Workflows/Review/Persistence`.
  - `ListReviewsInput { list: ReviewListKind; viewerUserId: string; viewerTeamIds: string[]; models: string[]; where?: ReviewListWhere | null; sort?: ReviewListSort | null; limit?: number | null; after?: string | null; canRead: ReviewReadPredicate }`, `ListReviewsOutput { items: ReviewData[]; meta: ReviewListMeta }`, `type ReviewReadPredicate = (review: ReviewData) => Promise<boolean>`.
  - `ReviewRepository.list(params: ReviewRepositoryListParams): Promise<Result<ReviewRepositoryListResult, ReviewPersistenceError>>`, `ReviewRepositoryListWhere`, `ReviewRepositoryListParams { where; sort: ReviewListSort; limit: number; after?: string | null }`, `ReviewRepositoryListResult { items: ReviewData[]; meta: CmsEntryMeta }`.
  - `ReviewListLimits.Interface { pageSize: number; maxScan: number }` (tunable in tests).
  - `matchesReviewList(review, params: ReviewListMatchParams): boolean`, `FAILED_STEP_LIST_TYPES = ["ai", "automation"]`.
  - `encodeReviewListCursor(cursor: ReviewListCursor): string`, `decodeReviewListCursor(value: string): ReviewListCursor | null`, `ReviewListCursor { after: string | null; skip: number }`.
  - Constants in `src/constants.ts`: `DEFAULT_REVIEW_LIST_LIMIT = 20`, `MAX_REVIEW_LIST_LIMIT = 100`, `MAX_REVIEW_LIST_SCAN = 200`, `REVIEW_LIST_PAGE_SIZE = 50`.
  - Messages: `"The review and step state filters apply only to the my requests list."`, `"The list cursor is invalid."`.

- [ ] **Step 1: Write the test helper and the failing tests**

Create `packages/api-workflows/__tests__/__helpers/listedReviews.ts`:

```ts
import type { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { Actor, ReviewData, ReviewState, StepState } from "~/domain/review/types.js";
import type { ListReviewsInput, ListReviewsOutput } from "~/features/review/ListReviews/index.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "./fixtures.js";

export interface ListedReviewParams {
    id: string;
    /** Minutes after 10:00 for `lastChangedOn`; give every seeded review its own, so no ties. */
    minute: number;
    model?: string;
    title?: string;
    /** Defaults to the `requester` fixture. */
    requester?: Actor;
    isActive?: boolean;
    state?: ReviewState;
    /** Default "awaiting". */
    stepState?: StepState | null;
    ownerId?: string | null;
    /** Default `[REVIEW_TEAM_ID]`. */
    teamIds?: string[];
    /** Default "review". */
    stepType?: string | null;
}

export const listedAt = (minute: number): string => {
    return `2026-10-09T10:${String(minute).padStart(2, "0")}:00.000Z`;
};

/**
 * A review with the list fields set directly, as the save path would store them. Lists read only
 * the top-level fields, so the steps stay those of a freshly requested review.
 */
export const createListedReview = (params: ListedReviewParams): ReviewData => {
    const base = toSaveData(
        createRequestedReview({
            id: params.id,
            targetRevisionId: `${params.id}#0001`,
            requester: params.requester
        })
    );
    return {
        ...base,
        model: params.model ?? ARTICLE_MODEL,
        title: params.title ?? `Review ${params.id}`,
        isActive: params.isActive ?? true,
        state: params.state ?? "inProgress",
        currentStepState: params.stepState === undefined ? "awaiting" : params.stepState,
        currentOwnerId: params.ownerId ?? null,
        currentCandidateTeamIds: params.teamIds ?? [REVIEW_TEAM_ID],
        currentStepType: params.stepType === undefined ? "review" : params.stepType,
        lastChangedOn: listedAt(params.minute)
    };
};

/** Saves through the repository: nothing produces these states yet (R93). */
export const seedListedReviews = async (
    repository: ReviewRepository.Interface,
    reviews: ListedReviewParams[]
): Promise<void> => {
    for (const params of reviews) {
        expectOk(await repository.save(createListedReview(params)));
    }
};

/** The `reviewer` fixture as viewer, member of `REVIEW_TEAM_ID`, every row readable. */
export const createListInput = (overrides: Partial<ListReviewsInput> = {}): ListReviewsInput => {
    return {
        list: "pool",
        viewerUserId: reviewer.id,
        viewerTeamIds: [REVIEW_TEAM_ID],
        models: [ARTICLE_MODEL],
        canRead: async () => true,
        ...overrides
    };
};

export const listedIds = (output: ListReviewsOutput): string[] => {
    return output.items.map(item => item.id);
};
```

Create `packages/api-workflows/__tests__/review/reviewListCursor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    decodeReviewListCursor,
    encodeReviewListCursor
} from "~/features/review/ListReviews/reviewListCursor.js";

const toBase64 = (value: unknown): string => {
    return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
};

describe("review list cursor (R92)", () => {
    it("round-trips the repository cursor and the examined rows", () => {
        for (const cursor of [
            { after: null, skip: 0 },
            { after: "eyJwYWdlIjoyfQ==", skip: 4 }
        ]) {
            expect(decodeReviewListCursor(encodeReviewListCursor(cursor))).toEqual(cursor);
        }
    });

    it("encodes base64 JSON of { after, skip }", () => {
        expect(encodeReviewListCursor({ after: "abc", skip: 2 })).toBe(
            toBase64({ after: "abc", skip: 2 })
        );
    });

    it("refuses anything else", () => {
        for (const value of [
            "not-a-cursor",
            "",
            toBase64([]),
            toBase64(null),
            toBase64({ after: 5, skip: 0 }),
            toBase64({ after: null }),
            toBase64({ after: null, skip: -1 }),
            toBase64({ after: null, skip: 1.5 }),
            toBase64({ after: null, skip: "2" })
        ]) {
            expect(decodeReviewListCursor(value)).toBeNull();
        }
    });
});
```

Create `packages/api-workflows/__tests__/review/ReviewRepositoryList.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { seedListedReviews } from "~tests/__helpers/listedReviews.js";
import {
    ARTICLE_MODEL,
    expectOk,
    OTHER_TEAM_ID,
    otherReviewer,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";

const BOTH_MODELS = [ARTICLE_MODEL, "wb.page"];

/**
 * r1: awaiting pool row; r2: owned by `reviewer`, other team, requested by `otherReviewer`, AI;
 * r3: failed automation page review, two teams; r4: cancelled, no current step.
 */
const createSeededRepository = async () => {
    let cmsListCalls = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(
                ListLatestEntriesUseCase.createDecorator({
                    decorator: class {
                        constructor(private decoratee: ListLatestEntriesUseCase.Interface) {}
                        async execute(
                            ...args: Parameters<ListLatestEntriesUseCase.Interface["execute"]>
                        ) {
                            cmsListCalls++;
                            return this.decoratee.execute(...args);
                        }
                    },
                    dependencies: []
                })
            );
        }
    });
    const repository = context.container.resolve(ReviewRepository);
    await seedListedReviews(repository, [
        { id: "r1", minute: 1, title: "Spring launch" },
        {
            id: "r2",
            minute: 2,
            title: "Autumn sale",
            requester: otherReviewer,
            stepState: "inReview",
            ownerId: reviewer.id,
            teamIds: [OTHER_TEAM_ID],
            stepType: "ai"
        },
        {
            id: "r3",
            minute: 3,
            model: "wb.page",
            stepState: "failed",
            teamIds: [REVIEW_TEAM_ID, OTHER_TEAM_ID],
            stepType: "automation"
        },
        {
            id: "r4",
            minute: 4,
            isActive: false,
            state: "cancelled",
            stepState: null,
            teamIds: [],
            stepType: null
        }
    ]);
    return {
        repository,
        cmsListCalls: () => cmsListCalls
    };
};

interface RepositoryListCase {
    name: string;
    where: Partial<ReviewRepository.ListWhere>;
    expected: string[];
}

/** One row per pre-filter key, alone: this is the A40 measurement on each storage. */
const CASES: RepositoryListCase[] = [
    { name: "no filter", where: {}, expected: ["r1", "r2", "r3", "r4"] },
    { name: "model_in", where: { model_in: [ARTICLE_MODEL] }, expected: ["r1", "r2", "r4"] },
    { name: "isActive", where: { isActive: true }, expected: ["r1", "r2", "r3"] },
    { name: "state", where: { state: "cancelled" }, expected: ["r4"] },
    { name: "currentStepState", where: { currentStepState: "inReview" }, expected: ["r2"] },
    { name: "currentOwnerId", where: { currentOwnerId: reviewer.id }, expected: ["r2"] },
    {
        name: "currentOwnerId_not",
        where: { currentOwnerId_not: reviewer.id },
        expected: ["r1", "r3", "r4"]
    },
    {
        name: "currentCandidateTeamIds_in",
        where: { currentCandidateTeamIds_in: [OTHER_TEAM_ID] },
        expected: ["r2", "r3"]
    },
    {
        name: "currentStepType_in",
        where: { currentStepType_in: ["ai", "automation"] },
        expected: ["r2", "r3"]
    },
    { name: "requesterId", where: { requesterId: otherReviewer.id }, expected: ["r2"] },
    {
        name: "requesterId_not",
        where: { requesterId_not: otherReviewer.id },
        expected: ["r1", "r3", "r4"]
    },
    { name: "title_contains", where: { title_contains: "launch" }, expected: ["r1"] }
];

describe("ReviewRepository.list (A40)", () => {
    it.each(CASES)("filters in storage by $name", async testCase => {
        const { repository } = await createSeededRepository();

        const page = expectOk(
            await repository.list({
                where: { model_in: BOTH_MODELS, ...testCase.where },
                sort: "lastChangedOn_ASC",
                limit: 50
            })
        );

        expect(page.items.map(item => item.id)).toEqual(testCase.expected);
    });

    it("sorts by lastChangedOn both ways and pages with the cursor", async () => {
        const { repository } = await createSeededRepository();
        const where = { model_in: BOTH_MODELS };

        const descending = expectOk(
            await repository.list({ where, sort: "lastChangedOn_DESC", limit: 50 })
        );
        const first = expectOk(
            await repository.list({ where, sort: "lastChangedOn_ASC", limit: 2 })
        );
        const second = expectOk(
            await repository.list({
                where,
                sort: "lastChangedOn_ASC",
                limit: 2,
                after: first.meta.cursor
            })
        );

        expect(descending.items.map(item => item.id)).toEqual(["r4", "r3", "r2", "r1"]);
        expect(first.items.map(item => item.id)).toEqual(["r1", "r2"]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(second.items.map(item => item.id)).toEqual(["r3", "r4"]);
        expect(second.meta.hasMoreItems).toBe(false);
    });

    it("answers an empty model or team list without querying", async () => {
        const { repository, cmsListCalls } = await createSeededRepository();
        const before = cmsListCalls();

        const noModels = expectOk(
            await repository.list({ where: { model_in: [] }, sort: "lastChangedOn_ASC", limit: 50 })
        );
        const noTeams = expectOk(
            await repository.list({
                where: { model_in: BOTH_MODELS, currentCandidateTeamIds_in: [] },
                sort: "lastChangedOn_ASC",
                limit: 50
            })
        );

        expect(noModels.items).toEqual([]);
        expect(noTeams.items).toEqual([]);
        expect(noTeams.meta).toEqual({ cursor: null, hasMoreItems: false, totalCount: 0 });
        expect(cmsListCalls()).toBe(before);
    });
});
```

Create `packages/api-workflows/__tests__/review/ListReviews.test.ts`:

```ts
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
            const review = reviews.find(item => item.id === id);
            if (!review || options.missingIds?.includes(id)) {
                return Result.fail(new ReviewNotFoundError({ id }));
            }
            return Result.ok(review);
        },
        getActiveByTarget: async () => Result.ok(null),
        countInProgressByWorkflow: async () => Result.ok(0),
        listInProgressByWorkflow: async () => Result.ok([]),
        listByTarget: async () => Result.ok([]),
        save: async review => Result.ok(review),
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
                    cursor: hasMoreItems ? String(end) : null,
                    hasMoreItems,
                    totalCount: reviews.length
                }
            });
        }
    };
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ReviewRepository, repository);
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
            { id: "a1", minute: 3, stepState: "inReview", ownerId: reviewer.id },
            { id: "a2", minute: 1, stepState: "inReview", ownerId: reviewer.id },
            { id: "a3", minute: 2, stepState: "inReview", ownerId: otherReviewer.id },
            { id: "a4", minute: 4, stepState: "awaiting" },
            {
                id: "a5",
                minute: 5,
                stepState: "inReview",
                ownerId: reviewer.id,
                isActive: false,
                state: "cancelled"
            },
            {
                id: "a6",
                minute: 6,
                stepState: "inReview",
                ownerId: reviewer.id,
                model: "cms.other"
            }
        ]);

        const result = expectOk(
            await listReviews.execute(createListInput({ list: "assignedToMe" }))
        );

        expect(listedIds(result)).toEqual(["a2", "a1"]);
        expect(result.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("lists awaiting reviews of the viewer's teams in pool, without the viewer's own requests", async () => {
        const listReviews = await createStorageContext([
            { id: "p1", minute: 1 },
            { id: "p2", minute: 2, teamIds: [OTHER_TEAM_ID] },
            { id: "p3", minute: 3, requester: reviewer },
            { id: "p4", minute: 4, teamIds: [OTHER_TEAM_ID, "team-reviewers"] },
            { id: "p5", minute: 5, stepState: "inReview", ownerId: otherReviewer.id }
        ]);

        const result = expectOk(await listReviews.execute(createListInput({ list: "pool" })));

        expect(listedIds(result)).toEqual(["p1", "p4"]);
    });

    it("lists the viewer's teams' reviews held by someone else in teamInReview", async () => {
        const listReviews = await createStorageContext([
            { id: "t1", minute: 1, stepState: "inReview", ownerId: otherReviewer.id },
            { id: "t2", minute: 2, stepState: "inReview", ownerId: reviewer.id },
            {
                id: "t3",
                minute: 3,
                stepState: "inReview",
                ownerId: otherReviewer.id,
                teamIds: [OTHER_TEAM_ID]
            },
            { id: "t4", minute: 4, stepState: "awaiting" }
        ]);

        const result = expectOk(
            await listReviews.execute(createListInput({ list: "teamInReview" }))
        );

        expect(listedIds(result)).toEqual(["t1"]);
    });

    it("lists the viewer's active requests in myRequests, newest change first, with state filters", async () => {
        const listReviews = await createStorageContext([
            { id: "m1", minute: 1, requester: reviewer },
            { id: "m2", minute: 2, requester: otherReviewer },
            {
                id: "m3",
                minute: 3,
                requester: reviewer,
                state: "approved",
                stepState: "approved"
            },
            {
                id: "m4",
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

        expect(listedIds(all)).toEqual(["m3", "m1"]);
        expect(listedIds(approved)).toEqual(["m3"]);
        expect(listedIds(awaiting)).toEqual(["m1"]);
    });

    it("lists failed AI and automation steps in failedSteps", async () => {
        const listReviews = await createStorageContext([
            { id: "f1", minute: 1, stepState: "failed", stepType: "ai" },
            { id: "f2", minute: 2, stepState: "failed", stepType: "automation" },
            { id: "f3", minute: 3, stepState: "failed", stepType: "review" },
            { id: "f4", minute: 4, stepState: "awaiting", stepType: "ai" }
        ]);

        const result = expectOk(
            await listReviews.execute(createListInput({ list: "failedSteps" }))
        );

        expect(listedIds(result)).toEqual(["f1", "f2"]);
    });

    it.each(ALL_LISTS)("filters %s by a part of the title", async list => {
        const listReviews = await createStorageContext([
            { id: "x1", minute: 1, title: "Spring LAUNCH", ...MATCHING[list] },
            { id: "x2", minute: 2, title: "Autumn sale", ...MATCHING[list] }
        ]);

        const all = expectOk(await listReviews.execute(createListInput({ list })));
        const filtered = expectOk(
            await listReviews.execute(createListInput({ list, where: { titleContains: "launch" } }))
        );

        expect(listedIds(all).sort()).toEqual(["x1", "x2"]);
        expect(listedIds(filtered)).toEqual(["x1"]);
    });

    it("takes either sort direction (D119)", async () => {
        const listReviews = await createStorageContext([
            { id: "s1", minute: 1 },
            { id: "s2", minute: 2 },
            { id: "m1", minute: 3, requester: reviewer },
            { id: "m2", minute: 4, requester: reviewer }
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
        expect(listedIds(poolDescending)).toEqual(["s2", "s1"]);
        expect(listedIds(myRequestsAscending)).toEqual(["m1", "m2"]);
    });

    it("lists only the given namespaces", async () => {
        const listReviews = await createStorageContext([
            { id: "n1", minute: 1 },
            { id: "n2", minute: 2, model: "wb.page" },
            { id: "n3", minute: 3, model: "cms.other" }
        ]);

        const both = expectOk(
            await listReviews.execute(createListInput({ models: [ARTICLE_MODEL, "wb.page"] }))
        );
        const pages = expectOk(await listReviews.execute(createListInput({ models: ["wb.page"] })));

        expect(listedIds(both)).toEqual(["n1", "n2"]);
        expect(listedIds(pages)).toEqual(["n2"]);
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
```

Create `packages/api-workflows/__tests__/review/ListReviewsPaging.test.ts`:

```ts
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
import {
    ListReviewsUseCase,
    type ListReviewsOutput
} from "~/features/review/ListReviews/index.js";
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

/** Pool rows `<prefix>1..<prefix>n`, one minute apart. */
const poolRows = (prefix: string, count: number): ListedReviewParams[] => {
    return Array.from({ length: count }, (_, index) => ({
        id: `${prefix}${index + 1}`,
        minute: index + 1
    }));
};

const readableExcept = (ids: string[]) => {
    return async (review: ReviewData) => !ids.includes(review.id);
};

describe("ListReviewsUseCase paging (D76, R92)", () => {
    it("skips reviews the predicate rejects and still fills the page", async () => {
        const listReviews = await createPagingContext(poolRows("p", 6));
        const canRead = readableExcept(["p2", "p4"]);

        const first = expectOk(await listReviews.execute(createListInput({ limit: 3, canRead })));
        const second = expectOk(
            await listReviews.execute(
                createListInput({ limit: 3, canRead, after: first.meta.cursor })
            )
        );

        expect(listedIds(first)).toEqual(["p1", "p3", "p5"]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(listedIds(second)).toEqual(["p6"]);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("counts a throwing predicate as unreadable", async () => {
        const listReviews = await createPagingContext(poolRows("p", 3));

        const result = expectOk(
            await listReviews.execute(
                createListInput({
                    canRead: async review => {
                        if (review.id === "p2") {
                            throw new Error("Target read failed.");
                        }
                        return true;
                    }
                })
            )
        );

        expect(listedIds(result)).toEqual(["p1", "p3"]);
    });

    it("returns every matching review exactly once across pages when the predicate skips rows", async () => {
        const listReviews = await createPagingContext([
            ...poolRows("q", 10),
            // Not in the pool: filtered out, never returned.
            { id: "n1", minute: 11, stepState: "inReview", ownerId: otherReviewer.id },
            { id: "n2", minute: 12, stepState: "inReview", ownerId: otherReviewer.id }
        ]);
        const canRead = readableExcept(["q3", "q6", "q9"]);

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

        expect(seen).toEqual(["q1", "q2", "q4", "q5", "q7", "q8", "q10"]);
        expect(new Set(seen).size).toBe(seen.length);
    });

    it("stops at the scan cap with hasMoreItems true and resumes from the cursor", async () => {
        const listReviews = await createPagingContext(poolRows("s", 8));
        const canRead = async (review: ReviewData) => review.id === "s7";

        const first = expectOk(await listReviews.execute(createListInput({ canRead })));
        const second = expectOk(
            await listReviews.execute(createListInput({ canRead, after: first.meta.cursor }))
        );

        // s1..s5 examined: the cap stops on the third row of the second repository page.
        expect(first.items).toEqual([]);
        expect(first.meta.hasMoreItems).toBe(true);
        const cursor = decodeReviewListCursor(first.meta.cursor ?? "");
        expect(cursor?.skip).toBe(2);
        expect(typeof cursor?.after).toBe("string");
        expect(listedIds(second)).toEqual(["s7"]);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the imports:

```ts
import { ListReviewsUseCase } from "~/features/review/ListReviews/index.js";
import { ReviewListLimits } from "~/features/review/ListReviews/ReviewListLimits.js";
```

and after `expect(container.resolveAll(ListTargetReviewsUseCase)).toHaveLength(1);` add:

```ts
        expect(container.resolveAll(ListReviewsUseCase)).toHaveLength(1);
        expect(container.resolveAll(ReviewListLimits)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/review/reviewListCursor.test.ts packages/api-workflows/__tests__/review/ReviewRepositoryList.test.ts packages/api-workflows/__tests__/review/ListReviews.test.ts packages/api-workflows/__tests__/review/ListReviewsPaging.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/ListReviews/index.js` / `reviewListCursor.js`; the repository test fails with `repository.list is not a function`.

- [ ] **Step 3: Constants and list types**

In `packages/api-workflows/src/constants.ts`, append:

```ts

/** Review lists (R92): rows per call by default and at most. */
export const DEFAULT_REVIEW_LIST_LIMIT = 20;
export const MAX_REVIEW_LIST_LIMIT = 100;
/** Rows a list call examines at most; a call may return a short page with more to come (D76, A41). */
export const MAX_REVIEW_LIST_SCAN = 200;
/** Repository page size of the review lists; constant, so a list cursor's `skip` stays valid. */
export const REVIEW_LIST_PAGE_SIZE = 50;
```

In `packages/api-workflows/src/domain/review/types.ts`, append:

```ts

/** The review lists of every app (spec 11, D47, D94, D112). */
export type ReviewListKind = "assignedToMe" | "pool" | "teamInReview" | "myRequests" | "failedSteps";

/** Lists sort by the last review event (D119). */
export type ReviewListSort = "lastChangedOn_ASC" | "lastChangedOn_DESC";

/** List filters. The namespace filter is the app wrapper's `models` input (R91, R94). */
export interface ReviewListWhere {
    /** A part of the title, case-insensitive; every list. */
    titleContains?: string | null;
    /** Only `myRequests` (D94); other lists fail with `ReviewValidationError`. */
    reviewState?: ReviewState | null;
    /** Only `myRequests` (D94); other lists fail with `ReviewValidationError`. */
    stepState?: StepState | null;
}

/** No `totalCount`: rows the viewer cannot read are skipped, so no exact count exists (D76). */
export interface ReviewListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
}
```

- [ ] **Step 4: The list conditions in code**

Create `packages/api-workflows/src/domain/review/matchesReviewList.ts`:

```ts
import type { ReviewData, ReviewListKind, ReviewListWhere } from "./types.js";

/** Current step types the failed steps list shows (D112). */
export const FAILED_STEP_LIST_TYPES = ["ai", "automation"];

export interface ReviewListMatchParams {
    list: ReviewListKind;
    viewerUserId: string;
    viewerTeamIds: string[];
    /** Namespace ids the app lists. */
    models: string[];
    where: ReviewListWhere;
}

const sharesTeam = (review: ReviewData, teamIds: string[]): boolean => {
    return review.currentCandidateTeamIds.some(teamId => teamIds.includes(teamId));
};

/**
 * Whether a review belongs to a list for one viewer (spec 11, R91). Pure. Run on the
 * primary-storage row of every listed hit: the storage pre-filter can be stale (R18) or, on a
 * storage that cannot express a condition, missing (A40).
 */
export const matchesReviewList = (review: ReviewData, params: ReviewListMatchParams): boolean => {
    if (!review.isActive || !params.models.includes(review.model)) {
        return false;
    }
    // Storage `title_contains` matches each word anywhere (case-insensitive), so code does too.
    const titleWords = (params.where.titleContains ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const title = review.title.toLowerCase();
    if (titleWords.length && !titleWords.every(word => title.includes(word))) {
        return false;
    }

    switch (params.list) {
        case "assignedToMe":
            return (
                review.currentStepState === "inReview" &&
                review.currentOwnerId === params.viewerUserId
            );
        case "pool":
            return (
                review.currentStepState === "awaiting" &&
                sharesTeam(review, params.viewerTeamIds) &&
                review.createdBy.id !== params.viewerUserId
            );
        case "teamInReview":
            return (
                review.currentStepState === "inReview" &&
                review.currentOwnerId !== params.viewerUserId &&
                sharesTeam(review, params.viewerTeamIds)
            );
        case "myRequests":
            return (
                review.createdBy.id === params.viewerUserId &&
                (!params.where.reviewState || review.state === params.where.reviewState) &&
                (!params.where.stepState || review.currentStepState === params.where.stepState)
            );
        case "failedSteps":
            return (
                review.currentStepState === "failed" &&
                review.currentStepType !== null &&
                FAILED_STEP_LIST_TYPES.includes(review.currentStepType)
            );
    }
};
```

- [ ] **Step 5: The repository list method**

In `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`, replace:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "../types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "../errors.js";
```

with:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData, ReviewListSort, ReviewState, StepState } from "../types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "../errors.js";
```

After `interface ReviewRepositoryByTargetParams { ... }` add:

```ts

/**
 * Storage pre-filter of the review lists (R91). Keys combine with AND; omitted keys do not
 * restrict. `ListReviewsUseCase` checks every condition again in code on the primary row (R18).
 */
export interface ReviewRepositoryListWhere {
    /** Namespace ids; an empty list matches nothing and is answered without a query. */
    model_in: string[];
    isActive?: boolean;
    state?: ReviewState;
    currentStepState?: StepState;
    currentOwnerId?: string;
    currentOwnerId_not?: string;
    /** Any shared team; an empty list matches nothing and is answered without a query. */
    currentCandidateTeamIds_in?: string[];
    currentStepType_in?: string[];
    /** The requester's id (stored as `requester.id`). */
    requesterId?: string;
    requesterId_not?: string;
    title_contains?: string;
}

export interface ReviewRepositoryListParams {
    where: ReviewRepositoryListWhere;
    sort: ReviewListSort;
    limit: number;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface ReviewRepositoryListResult {
    items: ReviewData[];
    meta: CmsEntryMeta;
}
```

In `interface IReviewRepository`, after `listByTarget(...)` add:

```ts
    /**
     * One page of reviews as the list index has them, in `sort` order. Not confirmed from primary
     * storage: on ddb-os a row can be stale, so callers confirm each row with `get` (R18).
     */
    list(
        params: ReviewRepositoryListParams
    ): Promise<Result<ReviewRepositoryListResult, ReviewPersistenceError>>;
```

In `namespace ReviewRepository`, add:

```ts
    export type ListWhere = ReviewRepositoryListWhere;
    export type ListParams = ReviewRepositoryListParams;
    export type ListResult = ReviewRepositoryListResult;
```

In `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`, add after `listByTarget` (before `save`):

```ts
    async list(
        params: Abstraction.ListParams
    ): Promise<Result<Abstraction.ListResult, ReviewPersistenceError>> {
        const { where } = params;
        // An empty `In` list throws on OpenSearch (DDB returns nothing): answer without querying.
        const emptyIn =
            where.model_in.length === 0 ||
            where.currentCandidateTeamIds_in?.length === 0 ||
            where.currentStepType_in?.length === 0;
        if (emptyIn) {
            return Result.ok({
                items: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            });
        }

        const model = await this.modelProvider.get();
        const values: CmsEntryListWhereValues = { model_in: [...where.model_in] };
        if (where.isActive !== undefined) {
            values.isActive = where.isActive;
        }
        if (where.state !== undefined) {
            values.state = where.state;
        }
        if (where.currentStepState !== undefined) {
            values.currentStepState = where.currentStepState;
        }
        if (where.currentOwnerId !== undefined) {
            values.currentOwnerId = where.currentOwnerId;
        }
        if (where.currentOwnerId_not !== undefined) {
            values.currentOwnerId_not = where.currentOwnerId_not;
        }
        if (where.currentCandidateTeamIds_in !== undefined) {
            values.currentCandidateTeamIds_in = [...where.currentCandidateTeamIds_in];
        }
        if (where.currentStepType_in !== undefined) {
            values.currentStepType_in = [...where.currentStepType_in];
        }
        if (where.title_contains !== undefined) {
            values.title_contains = where.title_contains;
        }
        const requester: CmsEntryListWhereValues = {};
        if (where.requesterId !== undefined) {
            requester.id = where.requesterId;
        }
        if (where.requesterId_not !== undefined) {
            requester.id_not = where.requesterId_not;
        }
        if (Object.keys(requester).length > 0) {
            values.requester = requester;
        }

        const result = await this.listLatestEntries.execute<ReviewEntryValues>(model, {
            where: { values },
            // Values fields sort with the `values_` prefix (CMS sort mapper).
            sort: [`values_${params.sort}`],
            limit: params.limit,
            after: params.after ?? null
        });
        if (result.isFail()) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok({
            items: result.value.entries.map(entry => ReviewEntryMapper.fromEntry(entry)),
            meta: result.value.meta
        });
    }
```

- [ ] **Step 6: Limits, cursor and storage filter of the use case**

Create `packages/api-workflows/src/features/review/ListReviews/ReviewListLimits.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface IReviewListLimits {
    /** Repository rows per page. Keep it constant: a cursor's `skip` counts rows of one page. */
    pageSize: number;
    /** Rows one list call examines at most (D76, A41). */
    maxScan: number;
}

/** Tunable page size and scan cap of the review lists; tests register smaller ones. */
export const ReviewListLimits = createAbstraction<IReviewListLimits>("ReviewListLimits");

export namespace ReviewListLimits {
    export type Interface = IReviewListLimits;
}
```

Create `packages/api-workflows/src/features/review/ListReviews/DefaultReviewListLimits.ts`:

```ts
import { MAX_REVIEW_LIST_SCAN, REVIEW_LIST_PAGE_SIZE } from "~/constants.js";
import { ReviewListLimits } from "./ReviewListLimits.js";

class DefaultReviewListLimitsImpl implements ReviewListLimits.Interface {
    readonly pageSize = REVIEW_LIST_PAGE_SIZE;
    readonly maxScan = MAX_REVIEW_LIST_SCAN;
}

export const DefaultReviewListLimits = ReviewListLimits.createImplementation({
    implementation: DefaultReviewListLimitsImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/features/review/ListReviews/reviewListCursor.ts`:

```ts
/** Where a list call stopped (R92): the repository page and how many of its rows were examined. */
export interface ReviewListCursor {
    /** `meta.cursor` of the repository page being read; `null` for the first page. */
    after: string | null;
    skip: number;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/** Opaque to clients: base64 of JSON `{ after, skip }`. Pure. */
export const encodeReviewListCursor = (cursor: ReviewListCursor): string => {
    return Buffer.from(JSON.stringify({ after: cursor.after, skip: cursor.skip }), "utf8").toString(
        "base64"
    );
};

/** `null` for anything `encodeReviewListCursor` did not produce. Pure. */
export const decodeReviewListCursor = (value: string): ReviewListCursor | null => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    } catch {
        return null;
    }
    if (!isRecord(parsed)) {
        return null;
    }
    const after = typeof parsed.after === "string" ? parsed.after : null;
    if (parsed.after !== null && after === null) {
        return null;
    }
    const skip = parsed.skip;
    if (typeof skip !== "number" || !Number.isInteger(skip) || skip < 0) {
        return null;
    }
    return { after, skip };
};
```

Create `packages/api-workflows/src/features/review/ListReviews/createReviewListWhere.ts`:

```ts
import type { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import {
    FAILED_STEP_LIST_TYPES,
    type ReviewListMatchParams
} from "~/domain/review/matchesReviewList.js";

/**
 * The storage pre-filter of a list (R91, A40). Pure. The same conditions run again in code
 * (`matchesReviewList`) on the primary row, so this only narrows what is examined.
 */
export const createReviewListWhere = (
    params: ReviewListMatchParams
): ReviewRepository.ListWhere => {
    const where: ReviewRepository.ListWhere = {
        model_in: [...params.models],
        isActive: true
    };
    const titleContains = params.where.titleContains?.trim();
    if (titleContains) {
        where.title_contains = titleContains;
    }

    switch (params.list) {
        case "assignedToMe":
            where.currentStepState = "inReview";
            where.currentOwnerId = params.viewerUserId;
            break;
        case "pool":
            where.currentStepState = "awaiting";
            where.currentCandidateTeamIds_in = [...params.viewerTeamIds];
            where.requesterId_not = params.viewerUserId;
            break;
        case "teamInReview":
            where.currentStepState = "inReview";
            where.currentOwnerId_not = params.viewerUserId;
            where.currentCandidateTeamIds_in = [...params.viewerTeamIds];
            break;
        case "myRequests":
            where.requesterId = params.viewerUserId;
            if (params.where.reviewState) {
                where.state = params.where.reviewState;
            }
            if (params.where.stepState) {
                where.currentStepState = params.where.stepState;
            }
            break;
        case "failedSteps":
            where.currentStepState = "failed";
            where.currentStepType_in = [...FAILED_STEP_LIST_TYPES];
            break;
    }
    return where;
};
```

- [ ] **Step 7: The use case**

Create `packages/api-workflows/src/features/review/ListReviews/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ReviewData,
    ReviewListKind,
    ReviewListMeta,
    ReviewListSort,
    ReviewListWhere
} from "~/domain/review/types.js";
import type { ReviewPersistenceError, ReviewValidationError } from "~/domain/review/errors.js";

/** Target read access for one row, from the app wrapper (D76, D133); a throw is "unreadable". */
export type ReviewReadPredicate = (review: ReviewData) => Promise<boolean>;

export interface ListReviewsInput {
    list: ReviewListKind;
    /** The viewer, built by the app wrapper (D132). */
    viewerUserId: string;
    viewerTeamIds: string[];
    /** Namespace ids the app lists (R91, R94); an empty list returns an empty page. */
    models: string[];
    where?: ReviewListWhere | null;
    /** Default `lastChangedOn_DESC` for `myRequests`, `lastChangedOn_ASC` otherwise (D119). */
    sort?: ReviewListSort | null;
    /** Default 20; values above 100 are clamped (R92). */
    limit?: number | null;
    /** `meta.cursor` of the previous call; valid only with the same list, where and sort. */
    after?: string | null;
    canRead: ReviewReadPredicate;
}

export interface ListReviewsOutput {
    items: ReviewData[];
    meta: ReviewListMeta;
}

export interface IListReviewsUseCaseErrors {
    /** State filters outside `myRequests`, or an invalid cursor. */
    validation: ReviewValidationError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IListReviewsUseCaseErrors[keyof IListReviewsUseCaseErrors];

export interface IListReviewsUseCase {
    execute(input: ListReviewsInput): Promise<Result<ListReviewsOutput, UseCaseError>>;
}

/**
 * One page of a review list (spec 11, D47, D76, R91, R92). Internal (D132): the app wrapper
 * passes the viewer, its namespaces and the target read predicate, and checks `reassign` for the
 * failed steps list (R95). Rows the predicate rejects are skipped; a call examines at most 200
 * rows, so a page can be short while `hasMoreItems` is true (A41).
 */
export const ListReviewsUseCase = createAbstraction<IListReviewsUseCase>("ListReviewsUseCase");

export namespace ListReviewsUseCase {
    export type Interface = IListReviewsUseCase;
    export type Input = ListReviewsInput;
    export type Output = ListReviewsOutput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListReviewsOutput, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/ListReviews/ListReviewsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { DEFAULT_REVIEW_LIST_LIMIT, MAX_REVIEW_LIST_LIMIT } from "~/constants.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewValidationError } from "~/domain/review/errors.js";
import {
    matchesReviewList,
    type ReviewListMatchParams
} from "~/domain/review/matchesReviewList.js";
import type { ReviewData } from "~/domain/review/types.js";
import { createReviewListWhere } from "./createReviewListWhere.js";
import {
    decodeReviewListCursor,
    encodeReviewListCursor,
    type ReviewListCursor
} from "./reviewListCursor.js";
import { ReviewListLimits } from "./ReviewListLimits.js";
import { ListReviewsUseCase as UseCase } from "./abstractions.js";

class ListReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private limits: ReviewListLimits.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const where = input.where ?? {};
        if (input.list !== "myRequests" && (where.reviewState || where.stepState)) {
            return Result.fail(
                new ReviewValidationError(
                    "The review and step state filters apply only to the my requests list."
                )
            );
        }
        let start: ReviewListCursor = { after: null, skip: 0 };
        if (input.after) {
            const decoded = decodeReviewListCursor(input.after);
            if (!decoded) {
                return Result.fail(new ReviewValidationError("The list cursor is invalid."));
            }
            start = decoded;
        }
        const needsTeams = input.list === "pool" || input.list === "teamInReview";
        if (input.models.length === 0 || (needsTeams && input.viewerTeamIds.length === 0)) {
            return Result.ok({ items: [], meta: { cursor: null, hasMoreItems: false } });
        }

        const limit = Math.min(
            Math.max(input.limit ?? DEFAULT_REVIEW_LIST_LIMIT, 1),
            MAX_REVIEW_LIST_LIMIT
        );
        const sort =
            input.sort ?? (input.list === "myRequests" ? "lastChangedOn_DESC" : "lastChangedOn_ASC");
        const match: ReviewListMatchParams = {
            list: input.list,
            viewerUserId: input.viewerUserId,
            viewerTeamIds: input.viewerTeamIds,
            models: input.models,
            where
        };
        const repositoryWhere = createReviewListWhere(match);

        const items: ReviewData[] = [];
        let examined = 0;
        let after = start.after;
        let skip = start.skip;
        for (;;) {
            const page = await this.repository.list({
                where: repositoryWhere,
                sort,
                limit: this.limits.pageSize,
                after
            });
            if (page.isFail()) {
                return Result.fail(page.error);
            }

            const rows = page.value.items;
            for (let index = skip; index < rows.length; index++) {
                if (items.length >= limit || examined >= this.limits.maxScan) {
                    // Item-level cursor: the next call resumes at this row of this page (R92).
                    return Result.ok({
                        items,
                        meta: {
                            cursor: encodeReviewListCursor({ after, skip: index }),
                            hasMoreItems: true
                        }
                    });
                }
                examined++;

                // The list index can be stale on ddb-os: trust only the primary row (R18).
                const primary = await this.repository.get(rows[index].id);
                if (primary.isFail()) {
                    if (primary.error instanceof ReviewNotFoundError) {
                        // Deleted after it was listed.
                        continue;
                    }
                    return Result.fail(primary.error);
                }
                const review = primary.value;
                if (!matchesReviewList(review, match)) {
                    continue;
                }

                let readable = false;
                try {
                    readable = await input.canRead(review);
                } catch {
                    // A failing target read hides the row instead of failing the list (R92).
                    readable = false;
                }
                if (readable) {
                    items.push(review);
                }
            }

            const { meta } = page.value;
            const next = meta.hasMoreItems ? meta.cursor : null;
            // A repeated cursor would loop forever; treat it as the end.
            if (!next || next === after) {
                return Result.ok({ items, meta: { cursor: null, hasMoreItems: false } });
            }
            after = next;
            skip = 0;
            if (items.length >= limit || examined >= this.limits.maxScan) {
                return Result.ok({
                    items,
                    meta: { cursor: encodeReviewListCursor({ after, skip: 0 }), hasMoreItems: true }
                });
            }
        }
    }
}

export const ListReviewsUseCase = UseCase.createImplementation({
    implementation: ListReviewsUseCaseImpl,
    dependencies: [ReviewRepository, ReviewListLimits]
});
```

Create `packages/api-workflows/src/features/review/ListReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DefaultReviewListLimits } from "./DefaultReviewListLimits.js";
import { ListReviewsUseCase } from "./ListReviewsUseCase.js";

export const ListReviewsFeature = createFeature({
    name: "Workflows/ListReviews",
    register(container) {
        container.register(DefaultReviewListLimits);
        container.register(ListReviewsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/ListReviews/index.ts`:

```ts
export { ListReviewsUseCase } from "./abstractions.js";
export type { ListReviewsInput, ListReviewsOutput, ReviewReadPredicate } from "./abstractions.js";
```

- [ ] **Step 8: Register**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import:

```ts
import { ListReviewsFeature } from "~/features/review/ListReviews/feature.js";
```

and replace:

```ts
        ListTargetReviewsFeature.register(container);
```

with:

```ts
        ListTargetReviewsFeature.register(container);
        // Review lists for the app wrappers (spec 11)
        ListReviewsFeature.register(container);
```

- [ ] **Step 9: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9). If a `ReviewRepositoryList.test.ts` case fails on one storage only, follow the A40 rule above (drop that key from the CMS mapping in Step 5, keep `matchesReviewList`), rerun both commands, and record the key in the report.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows" | head`
Expected: no output.

- [ ] **Step 10: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`), then commit:

```
feat(api-workflows): add the review list use case with a read predicate and an item cursor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
