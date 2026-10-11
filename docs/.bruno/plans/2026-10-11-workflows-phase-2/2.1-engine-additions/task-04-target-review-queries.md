### Task 4: Get and list a target's reviews

The CMS and WB handlers (save block R54, publish rule R53, move rule R55) and the delete cleanup (Task 5) need a target's reviews without reaching into the repository. Two internal use cases: the active review of one revision, and every review of a target (all revisions). Both confirm listed hits from primary storage (R18, A29).

**Files:**
- Modify: `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`
- Create: `packages/api-workflows/src/features/review/GetTargetReview/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/GetTargetReview/GetTargetReviewUseCase.ts`
- Create: `packages/api-workflows/src/features/review/GetTargetReview/feature.ts`
- Create: `packages/api-workflows/src/features/review/GetTargetReview/index.ts`
- Create: `packages/api-workflows/src/features/review/ListTargetReviews/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ListTargetReviews/ListTargetReviewsUseCase.ts`
- Create: `packages/api-workflows/src/features/review/ListTargetReviews/feature.ts`
- Create: `packages/api-workflows/src/features/review/ListTargetReviews/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/review/TargetReviews.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: `ReviewRepository.getActiveByTarget` (1a), `readPrimary` (private, 1a).
- Produces:
  - `ReviewRepositoryByTargetParams { model: string; targetId: string; targetRevisionId?: string }`; `ReviewRepository.Interface.listByTarget(params): Promise<Result<ReviewData[], ReviewPersistenceError>>` (oldest first, every page).
  - `GetTargetReviewUseCase.Interface.execute(input: GetTargetReviewInput): Promise<Result<ReviewData | null, ReviewPersistenceError>>`, `GetTargetReviewInput { model: string; targetRevisionId: string }`.
  - `ListTargetReviewsUseCase.Interface.execute(input: ListTargetReviewsInput): Promise<Result<ReviewData[], ReviewPersistenceError>>`, `ListTargetReviewsInput { model: string; targetId: string }`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/review/TargetReviews.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    requester,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetTargetReviewUseCase } from "~/features/review/GetTargetReview/index.js";
import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

/**
 * article-1#0001: active (review-1); article-1#0002: cancelled (review-2);
 * article-2#0001: active (review-3), another target.
 */
const createTargetReviews = async () => {
    const { context } = await createContextHandler();
    const repository = context.container.resolve(ReviewRepository);

    expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));
    const cancelled = createRequestedReview({
        id: "review-2",
        targetRevisionId: "article-1#0002"
    });
    expectOk(cancelled.cancel({ actor: requester, now: LATER }));
    expectOk(await repository.save(toSaveData(cancelled)));
    expectOk(
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-3", targetRevisionId: "article-2#0001" }))
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/TargetReviews.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/GetTargetReview/index.js`.

- [ ] **Step 3: List a target's reviews in the repository**

In `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`, add before `IReviewRepository`:

```ts
export interface ReviewRepositoryByTargetParams {
    model: string;
    targetId: string;
    /** Only the reviews of this revision; every revision when omitted. */
    targetRevisionId?: string;
}
```

add to `IReviewRepository` after `listInProgressByWorkflow`:

```ts
    /** Every review of a target (active or not), confirmed from primary storage (R18). */
    listByTarget(
        params: ReviewRepositoryByTargetParams
    ): Promise<Result<ReviewData[], ReviewPersistenceError>>;
```

and add `export type ByTargetParams = ReviewRepositoryByTargetParams;` to the `ReviewRepository` namespace.

In `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`, add `import type { CmsEntryListWhereValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";` (replacing the existing `CmsModel`-only type import) and add after `listInProgressByWorkflow`:

```ts
    async listByTarget(
        params: Abstraction.ByTargetParams
    ): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const values: CmsEntryListWhereValues = {
            model: params.model,
            targetId: params.targetId
        };
        if (params.targetRevisionId) {
            values.targetRevisionId = params.targetRevisionId;
        }

        const reviews: ReviewData[] = [];
        let after: string | null = null;
        do {
            const result: Awaited<ListLatestEntriesUseCase.Return<ReviewEntryValues>> =
                await this.listLatestEntries.execute<ReviewEntryValues>(model, {
                    where: { values },
                    sort: ["createdOn_ASC"],
                    limit: COUNT_PAGE_SIZE,
                    after
                });
            if (result.isFail()) {
                return Result.fail(new ReviewPersistenceError(result.error));
            }

            for (const entry of result.value.entries) {
                const confirmed = await this.readPrimary(model, entry.id);
                if (confirmed.isFail()) {
                    return Result.fail(confirmed.error);
                }
                const review = confirmed.value;
                if (
                    review &&
                    review.model === params.model &&
                    review.targetId === params.targetId &&
                    (!params.targetRevisionId ||
                        review.targetRevisionId === params.targetRevisionId)
                ) {
                    reviews.push(review);
                }
            }

            const { meta } = result.value;
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        return Result.ok(reviews);
    }
```

- [ ] **Step 4: Add GetTargetReview**

Create `packages/api-workflows/src/features/review/GetTargetReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface GetTargetReviewInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetRevisionId: string;
}

export interface IGetTargetReviewUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IGetTargetReviewUseCaseErrors[keyof IGetTargetReviewUseCaseErrors];

export interface IGetTargetReviewUseCase {
    execute(input: GetTargetReviewInput): Promise<Result<ReviewData | null, UseCaseError>>;
}

/**
 * The active review of a target revision, or `null` (D23). Internal (D132): used by the app
 * adapters' save block and publish rule (R53, R54); phase 3's `getTargetReview` wrappers add the
 * read check.
 */
export const GetTargetReviewUseCase =
    createAbstraction<IGetTargetReviewUseCase>("GetTargetReviewUseCase");

export namespace GetTargetReviewUseCase {
    export type Interface = IGetTargetReviewUseCase;
    export type Input = GetTargetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData | null, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/GetTargetReview/GetTargetReviewUseCase.ts`:

```ts
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetTargetReviewUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
    }
}

export const GetTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetTargetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

Create `packages/api-workflows/src/features/review/GetTargetReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetTargetReviewUseCase } from "./GetTargetReviewUseCase.js";

export const GetTargetReviewFeature = createFeature({
    name: "Workflows/GetTargetReview",
    register(container) {
        container.register(GetTargetReviewUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/GetTargetReview/index.ts`:

```ts
export { GetTargetReviewUseCase } from "./abstractions.js";
export type { GetTargetReviewInput } from "./abstractions.js";
```

- [ ] **Step 5: Add ListTargetReviews**

Create `packages/api-workflows/src/features/review/ListTargetReviews/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface ListTargetReviewsInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /** The entry or page id, across all revisions. */
    targetId: string;
}

export interface IListTargetReviewsUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IListTargetReviewsUseCaseErrors[keyof IListTargetReviewsUseCaseErrors];

export interface IListTargetReviewsUseCase {
    execute(input: ListTargetReviewsInput): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * Every review of a target, all revisions, active or not. Internal (D132): used by the adapters'
 * move rule (R55).
 */
export const ListTargetReviewsUseCase =
    createAbstraction<IListTargetReviewsUseCase>("ListTargetReviewsUseCase");

export namespace ListTargetReviewsUseCase {
    export type Interface = IListTargetReviewsUseCase;
    export type Input = ListTargetReviewsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/ListTargetReviews/ListTargetReviewsUseCase.ts`:

```ts
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ListTargetReviewsUseCase as UseCase } from "./abstractions.js";

class ListTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.listByTarget({ model: input.model, targetId: input.targetId });
    }
}

export const ListTargetReviewsUseCase = UseCase.createImplementation({
    implementation: ListTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

Create `packages/api-workflows/src/features/review/ListTargetReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListTargetReviewsUseCase } from "./ListTargetReviewsUseCase.js";

export const ListTargetReviewsFeature = createFeature({
    name: "Workflows/ListTargetReviews",
    register(container) {
        container.register(ListTargetReviewsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/ListTargetReviews/index.ts`:

```ts
export { ListTargetReviewsUseCase } from "./abstractions.js";
export type { ListTargetReviewsInput } from "./abstractions.js";
```

- [ ] **Step 6: Register and pin the registration**

In `packages/api-workflows/src/WorkflowsFeature.ts` import

```ts
import { GetTargetReviewFeature } from "~/features/review/GetTargetReview/feature.js";
import { ListTargetReviewsFeature } from "~/features/review/ListTargetReviews/feature.js";
```

and register them after `CancelReviewFeature.register(container);`:

```ts
        // Target queries for the app adapters (phase 2)
        GetTargetReviewFeature.register(container);
        ListTargetReviewsFeature.register(container);
```

In `packages/api-workflows/__tests__/registration.test.ts` import `GetTargetReviewUseCase` and `ListTargetReviewsUseCase` from their `index.js` and add after the `CancelReviewUseCase` expectation:

```ts
        expect(container.resolveAll(GetTargetReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListTargetReviewsUseCase)).toHaveLength(1);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then commit:

```
feat(api-workflows): add use cases to get and list a target's reviews

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
