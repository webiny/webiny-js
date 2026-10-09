### Task 8: Request and get review use cases

**Files:**
- Create: `packages/api-workflows/src/features/review/RequestReview/{abstractions.ts,RequestReviewUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/GetReview/{abstractions.ts,GetReviewUseCase.ts,feature.ts,index.ts}`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeReviewTargetLoader.ts`
- Create: `packages/api-workflows/__tests__/__helpers/reviewContext.ts`
- Create: `packages/api-workflows/__tests__/review/RequestReview.test.ts`

**Interfaces:**
- Consumes: `WorkflowRepository` (Task 3), `ReviewRepository` (Task 6), `ReviewTargetLoader`, `ReviewStepReacher`, `ReviewSaver` (Task 7), `Review` (Tasks 4-5), `mdbid` (`@webiny/utils`).
- Produces:
  - `RequestReviewUseCase.execute(input: RequestReviewInput): Promise<Result<ReviewData, RequestReviewUseCase.Error>>` with `RequestReviewInput { model: string; targetId: string; targetRevisionId: string; picks?: ReviewPick[]; actor: Actor }`. Errors: `Workflows/Review/WorkflowNotFound`, `AlreadyActive`, `TargetNotFound`, `Validation`, `InvalidState`, `Persistence`, `TargetSync` (R16: the review is saved and its events published; `error.data.review` holds it).
  - Target loader choice: when several loaders' `canLoad` match, the last registered wins (same rule as single-registration DI resolve).
  - `GetReviewUseCase.execute(input: { id: string }): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>`.
  - Test helpers: `FakeReviewTargetLoader`, `MISSING_TARGET_ID`, `createReviewContext(params?)`, `createRequestInput(overrides?)`.

- [ ] **Step 1: Write the test helpers**

Create `packages/api-workflows/__tests__/__helpers/FakeReviewTargetLoader.ts`:

```ts
import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { ARTICLE_MODEL, targetContext } from "./fixtures.js";

/** A target id the fake loader reports as missing. */
export const MISSING_TARGET_ID = "article-missing";

/** Loads "cms.article" targets only; title is "Article <targetId>". */
class FakeReviewTargetLoaderImpl implements ReviewTargetLoader.Interface {
    canLoad(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    async load(params: ReviewTargetLoader.LoadParams): Promise<ReviewTargetLoader.Target | null> {
        if (params.targetId === MISSING_TARGET_ID) {
            return null;
        }
        const title = `Article ${params.targetId}`;
        return {
            title,
            context: { ...targetContext, title }
        };
    }
}

export const FakeReviewTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: FakeReviewTargetLoaderImpl,
    dependencies: []
});
```

Create `packages/api-workflows/__tests__/__helpers/reviewContext.ts`:

```ts
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import type { RequestReviewInput } from "~/features/review/RequestReview/index.js";
import { createContextHandler } from "./handler.js";
import { FakeReviewTargetLoader } from "./FakeReviewTargetLoader.js";
import { RecordingReviewTargetSync, recordedSyncs } from "./RecordingReviewTargetSync.js";
import { RecordingEventPublisher, recordedEvents } from "./RecordingEventPublisher.js";
import { ARTICLE_MODEL, createWorkflowValues, requester } from "./fixtures.js";

/**
 * Context with the fake target loader, the sync and event recorders, and the "Article review"
 * workflow stored. Recorders are empty when it returns.
 */
export const createReviewContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.register(FakeReviewTargetLoader);
            container.registerDecorator(RecordingReviewTargetSync);
            container.registerDecorator(RecordingEventPublisher);
            await params.setup?.(container);
        }
    });

    const stored = await context.container
        .resolve(StoreWorkflowUseCase)
        .execute({ workflow: createWorkflowValues() });
    if (stored.isFail()) {
        throw stored.error;
    }

    recordedSyncs.length = 0;
    recordedEvents.length = 0;

    return {
        context,
        workflow: stored.value
    };
};

export const createRequestInput = (
    overrides: Partial<RequestReviewInput> = {}
): RequestReviewInput => {
    return {
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        picks: [],
        actor: requester,
        ...overrides
    };
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/api-workflows/__tests__/review/RequestReview.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { MISSING_TARGET_ID } from "~tests/__helpers/FakeReviewTargetLoader.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { FailingReviewTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import { workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import {
    ARTICLE_MODEL,
    createWorkflowValues,
    expectOk,
    otherReviewer,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";

describe("RequestReviewUseCase", () => {
    it("requests a review and reaches the first step through the pool", async () => {
        const { context, workflow } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput());

        expect(result.isOk()).toBe(true);
        const review = result.value;
        expect(review).toMatchObject({
            workflowId: workflow.id,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article article-1",
            isActive: true,
            state: "inProgress",
            currentStepId: "legal",
            currentStepState: "awaiting",
            currentOwnerId: null,
            currentCandidateTeamIds: [REVIEW_TEAM_ID],
            createdBy: requester,
            workflow: { name: workflow.name, models: workflow.models }
        });
        expect(review.targetContext).toEqual({ ...targetContext, title: "Article article-1" });
        expect(review.steps.map(step => step.state)).toEqual(["awaiting", "pending"]);
        expect(review.steps[0].assignment).toEqual({ source: "pool" });
        expect(recordedSyncs.map(sync => sync.systemWorkflow)).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "awaiting"
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);

        const read = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(read.value).toEqual(review);
    });

    it("stores picks on the review steps; the default resolver leaves the step in the pool", async () => {
        const { context } = await createReviewContext();

        const result = await context.container.resolve(RequestReviewUseCase).execute(
            createRequestInput({ picks: [{ stepId: "legal", userId: otherReviewer.id }] })
        );

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({
            pickedUserId: otherReviewer.id,
            state: "awaiting",
            owner: null
        });
    });

    it("rejects picks for unknown steps or steps without manual picks", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);

        const unknownStep = await requestReview.execute(
            createRequestInput({ picks: [{ stepId: "missing", userId: otherReviewer.id }] })
        );
        const noPicks = await requestReview.execute(
            createRequestInput({ picks: [{ stepId: "editorial", userId: otherReviewer.id }] })
        );

        expect(unknownStep.error.code).toBe("Workflows/Review/Validation");
        expect(noPicks.error.code).toBe("Workflows/Review/Validation");
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("allows one active review per target revision", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);
        const first = await requestReview.execute(createRequestInput());

        const second = await requestReview.execute(createRequestInput());

        expect(second.isFail()).toBe(true);
        expect(second.error.code).toBe("Workflows/Review/AlreadyActive");
        expect(second.error.data).toEqual({
            reviewId: first.value.id,
            targetRevisionId: "article-1#0001"
        });

        const otherRevision = await requestReview.execute(
            createRequestInput({ targetRevisionId: "article-1#0002" })
        );
        expect(otherRevision.isOk()).toBe(true);
    });

    it("fails with TargetNotFound when the target is missing or no loader handles the model", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);
        await context.container.resolve(StoreWorkflowUseCase).execute({
            workflow: createWorkflowValues({ id: "workflow-pages", models: ["wb.page"] })
        });

        const missing = await requestReview.execute(
            createRequestInput({
                targetId: MISSING_TARGET_ID,
                targetRevisionId: `${MISSING_TARGET_ID}#0001`
            })
        );
        const noLoader = await requestReview.execute(
            createRequestInput({ model: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0001" })
        );

        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(missing.error.data).toEqual({
            model: ARTICLE_MODEL,
            targetRevisionId: `${MISSING_TARGET_ID}#0001`
        });
        expect(noLoader.error.code).toBe("Workflows/Review/TargetNotFound");
    });

    it("keeps the requested review when the target sync fails", async () => {
        const { context } = await createReviewContext({
            setup: container => {
                container.registerDecorator(FailingReviewTargetSync);
            }
        });
        const requestReview = context.container.resolve(RequestReviewUseCase);

        const result = await requestReview.execute(createRequestInput());

        expect(result.isFail()).toBe(true);
        const error = result.error;
        if (error.code !== "Workflows/Review/TargetSync") {
            throw error;
        }
        const read = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: error.data.review.id })
        );
        expect(error.data).toEqual({ review: read });
        expect(read).toMatchObject({ isActive: true, currentStepState: "awaiting" });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);

        // The saved review is active, so a retry is refused instead of creating a second one.
        const retry = await requestReview.execute(createRequestInput());
        expect(retry.error.code).toBe("Workflows/Review/AlreadyActive");
    });

    it("fails when no workflow is bound to the model", async () => {
        const { context } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput({ model: "cms.unbound" }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/WorkflowNotFound");
        expect(result.error.data).toEqual({ model: "cms.unbound" });
    });
});

describe("GetReviewUseCase", () => {
    it("returns NotFound for an unknown review", async () => {
        const { context } = await createReviewContext();

        const result = await context.container.resolve(GetReviewUseCase).execute({ id: "missing" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/RequestReview.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/RequestReview/index.js`.

- [ ] **Step 4: Add `RequestReview`**

Create `packages/api-workflows/src/features/review/RequestReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData, ReviewPick } from "~/domain/review/types.js";
import type {
    ReviewAlreadyActiveError,
    ReviewInvalidStateError,
    ReviewPersistenceError,
    ReviewTargetNotFoundError,
    ReviewTargetSyncError,
    ReviewValidationError,
    ReviewWorkflowNotFoundError
} from "~/domain/review/errors.js";

export interface RequestReviewInput {
    /** Namespace id of the target, e.g. "cms.article" (D15). */
    model: string;
    targetId: string;
    targetRevisionId: string;
    /** Reviewer picks per step (D22). Only malformed picks are rejected here (spec 6). */
    picks?: ReviewPick[];
    /** The requester. 1a takes it explicitly; phase 1b checks permissions and identity. */
    actor: Actor;
}

export interface IRequestReviewUseCaseErrors {
    workflowNotFound: ReviewWorkflowNotFoundError;
    alreadyActive: ReviewAlreadyActiveError;
    targetNotFound: ReviewTargetNotFoundError;
    validation: ReviewValidationError;
    invalidState: ReviewInvalidStateError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IRequestReviewUseCaseErrors[keyof IRequestReviewUseCaseErrors];

export interface IRequestReviewUseCase {
    execute(input: RequestReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Start a review of a target revision with the workflow bound to its model (spec 5.1). */
export const RequestReviewUseCase =
    createAbstraction<IRequestReviewUseCase>("RequestReviewUseCase");

export namespace RequestReviewUseCase {
    export type Interface = IRequestReviewUseCase;
    export type Input = RequestReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/RequestReview/RequestReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { mdbid } from "@webiny/utils";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { Review } from "~/domain/review/Review.js";
import {
    ReviewAlreadyActiveError,
    ReviewPersistenceError,
    ReviewTargetNotFoundError,
    ReviewWorkflowNotFoundError
} from "~/domain/review/errors.js";
import { ReviewTargetLoader } from "../ReviewTargetLoader/abstractions.js";
import { ReviewStepReacher } from "../ReviewStepReacher/abstractions.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { RequestReviewUseCase as UseCase } from "./abstractions.js";

class RequestReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private workflowRepository: WorkflowRepository.Interface,
        private reviewRepository: ReviewRepository.Interface,
        private targetLoaders: ReviewTargetLoader.Interface[],
        private stepReacher: ReviewStepReacher.Interface,
        private reviewSaver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        // v1 binds at most one workflow to a model (D15).
        const workflows = await this.workflowRepository.list({
            where: { models_in: [input.model] },
            limit: 1
        });
        if (workflows.isFail()) {
            return Result.fail(new ReviewPersistenceError(workflows.error));
        }
        const [workflow] = workflows.value.items;
        if (!workflow) {
            return Result.fail(new ReviewWorkflowNotFoundError({ model: input.model }));
        }

        const active = await this.reviewRepository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
        if (active.isFail()) {
            return Result.fail(active.error);
        }
        if (active.value) {
            return Result.fail(
                new ReviewAlreadyActiveError({
                    reviewId: active.value.id,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        // Several loaders may match (e.g. a generic "cms.*" one and a specific one); the last
        // registered wins, the same rule as resolving a single registration.
        const loader = [...this.targetLoaders].reverse().find(item => item.canLoad(input.model));
        const target = loader
            ? await loader.load({
                  model: input.model,
                  targetId: input.targetId,
                  targetRevisionId: input.targetRevisionId
              })
            : null;
        if (!target) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        const now = new Date().toISOString();
        const requested = Review.request({
            id: mdbid(),
            workflow,
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            title: target.title,
            targetContext: target.context,
            picks: input.picks ?? [],
            requester: input.actor,
            now
        });
        if (requested.isFail()) {
            return Result.fail(requested.error);
        }
        const review = requested.value;

        const reached = await this.stepReacher.reach({ review, actor: input.actor, now });
        if (reached.isFail()) {
            return Result.fail(reached.error);
        }

        return this.reviewSaver.save(review);
    }
}

export const RequestReviewUseCase = UseCase.createImplementation({
    implementation: RequestReviewUseCaseImpl,
    dependencies: [
        WorkflowRepository,
        ReviewRepository,
        [ReviewTargetLoader, { multiple: true }],
        ReviewStepReacher,
        ReviewSaver
    ]
});
```

Create `packages/api-workflows/src/features/review/RequestReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RequestReviewUseCase } from "./RequestReviewUseCase.js";

export const RequestReviewFeature = createFeature({
    name: "Workflows/RequestReview",
    register(container) {
        container.register(RequestReviewUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/RequestReview/index.ts`:

```ts
export { RequestReviewUseCase } from "./abstractions.js";
export type { RequestReviewInput } from "./abstractions.js";
```

- [ ] **Step 5: Add `GetReview`**

Create `packages/api-workflows/src/features/review/GetReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";

export interface GetReviewInput {
    id: string;
}

export interface IGetReviewUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IGetReviewUseCaseErrors[keyof IGetReviewUseCaseErrors];

export interface IGetReviewUseCase {
    execute(input: GetReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Get one review. Viewer flags and read permissions arrive in phase 1b. */
export const GetReviewUseCase = createAbstraction<IGetReviewUseCase>("GetReviewUseCase");

export namespace GetReviewUseCase {
    export type Interface = IGetReviewUseCase;
    export type Input = GetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/GetReview/GetReviewUseCase.ts`:

```ts
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetReviewUseCase as UseCase } from "./abstractions.js";

class GetReviewUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.get(input.id);
    }
}

export const GetReviewUseCase = UseCase.createImplementation({
    implementation: GetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

Create `packages/api-workflows/src/features/review/GetReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetReviewUseCase } from "./GetReviewUseCase.js";

export const GetReviewFeature = createFeature({
    name: "Workflows/GetReview",
    register(container) {
        container.register(GetReviewUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/GetReview/index.ts`:

```ts
export { GetReviewUseCase } from "./abstractions.js";
export type { GetReviewInput } from "./abstractions.js";
```

- [ ] **Step 6: Register the use cases**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the imports

```ts
import { RequestReviewFeature } from "~/features/review/RequestReview/feature.js";
import { GetReviewFeature } from "~/features/review/GetReview/feature.js";
```

and replace the `// Reviews` block with:

```ts
        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
        RequestReviewFeature.register(container);
        GetReviewFeature.register(container);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/RequestReview.test.ts 2>&1 | tail -50`
Expected: PASS (8 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add request and get review use cases

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
