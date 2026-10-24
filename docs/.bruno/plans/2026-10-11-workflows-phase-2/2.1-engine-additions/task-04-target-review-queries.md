### Task 4: Get and list a target's reviews, get the bound workflow

The CMS and WB handlers (save block R54, publish rule R53, move rule R55, trash and delete rules R73) and the delete cleanup (Task 5) need a target's reviews and the namespace's workflow without reaching into the repositories. Three internal use cases: the active review of one revision, every review of a target (all revisions), and the workflow bound to a namespace (v1 binds at most one, D15). The review queries confirm listed hits from primary storage (R18, A29).

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
- Create: `packages/api-workflows/src/features/workflow/GetBoundWorkflow/abstractions.ts`
- Create: `packages/api-workflows/src/features/workflow/GetBoundWorkflow/GetBoundWorkflowUseCase.ts`
- Create: `packages/api-workflows/src/features/workflow/GetBoundWorkflow/feature.ts`
- Create: `packages/api-workflows/src/features/workflow/GetBoundWorkflow/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/review/TargetReviews.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: `ReviewRepository.getActiveByTarget` (1a), `readPrimary` (private, 1a), `ListWorkflowsUseCase` (1a), `StoreWorkflowUseCase` and the `editor` fixture (Task 2).
- Produces:
  - `ReviewRepositoryByTargetParams { model: string; targetId: string; targetRevisionId?: string }`; `ReviewRepository.Interface.listByTarget(params): Promise<Result<ReviewData[], ReviewPersistenceError>>` (oldest first, every page).
  - `GetTargetReviewUseCase.Interface.execute(input: GetTargetReviewInput): Promise<Result<ReviewData | null, ReviewPersistenceError>>`, `GetTargetReviewInput { model: string; targetRevisionId: string }`.
  - `ListTargetReviewsUseCase.Interface.execute(input: ListTargetReviewsInput): Promise<Result<ReviewData[], ReviewPersistenceError>>`, `ListTargetReviewsInput { model: string; targetId: string }`.
  - `GetBoundWorkflowUseCase.Interface.execute(input: GetBoundWorkflowInput): Promise<Result<Workflow | null, WorkflowPersistenceError>>`, `GetBoundWorkflowInput { model: string }`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/review/TargetReviews.test.ts`:

```ts
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

- [ ] **Step 6: Add GetBoundWorkflow**

Create `packages/api-workflows/src/features/workflow/GetBoundWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";

export interface GetBoundWorkflowInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
}

export interface IGetBoundWorkflowUseCaseErrors {
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IGetBoundWorkflowUseCaseErrors[keyof IGetBoundWorkflowUseCaseErrors];

export interface IGetBoundWorkflowUseCase {
    execute(input: GetBoundWorkflowInput): Promise<Result<Workflow | null, UseCaseError>>;
}

/**
 * The workflow bound to a namespace, or `null` (v1 binds at most one, D15). Internal (D132): the
 * app adapters' rules ask it first, so unbound models never look up reviews (D134, R54).
 */
export const GetBoundWorkflowUseCase =
    createAbstraction<IGetBoundWorkflowUseCase>("GetBoundWorkflowUseCase");

export namespace GetBoundWorkflowUseCase {
    export type Interface = IGetBoundWorkflowUseCase;
    export type Input = GetBoundWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow | null, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/GetBoundWorkflow/GetBoundWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { GetBoundWorkflowUseCase as UseCase } from "./abstractions.js";

class GetBoundWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(private listWorkflows: ListWorkflowsUseCase.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const listed = await this.listWorkflows.execute({
            where: { models_in: [input.model] },
            limit: 1
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }
        return Result.ok(listed.value.items[0] ?? null);
    }
}

export const GetBoundWorkflowUseCase = UseCase.createImplementation({
    implementation: GetBoundWorkflowUseCaseImpl,
    dependencies: [ListWorkflowsUseCase]
});
```

Create `packages/api-workflows/src/features/workflow/GetBoundWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetBoundWorkflowUseCase } from "./GetBoundWorkflowUseCase.js";

export const GetBoundWorkflowFeature = createFeature({
    name: "Workflows/GetBoundWorkflow",
    register(container) {
        container.register(GetBoundWorkflowUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/GetBoundWorkflow/index.ts`:

```ts
export { GetBoundWorkflowUseCase } from "./abstractions.js";
export type { GetBoundWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 7: Register and pin the registration**

In `packages/api-workflows/src/WorkflowsFeature.ts` import

```ts
import { GetTargetReviewFeature } from "~/features/review/GetTargetReview/feature.js";
import { ListTargetReviewsFeature } from "~/features/review/ListTargetReviews/feature.js";
import { GetBoundWorkflowFeature } from "~/features/workflow/GetBoundWorkflow/feature.js";
```

and register them after `CancelReviewFeature.register(container);`:

```ts
        // Target queries for the app adapters (phase 2)
        GetTargetReviewFeature.register(container);
        ListTargetReviewsFeature.register(container);
        GetBoundWorkflowFeature.register(container);
```

In `packages/api-workflows/__tests__/registration.test.ts` import `GetTargetReviewUseCase`, `ListTargetReviewsUseCase` and `GetBoundWorkflowUseCase` from their `index.js` and add after the `CancelReviewUseCase` expectation:

```ts
        expect(container.resolveAll(GetTargetReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListTargetReviewsUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetBoundWorkflowUseCase)).toHaveLength(1);
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then commit:

```
feat(api-workflows): add use cases for a target's reviews and a namespace's workflow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
