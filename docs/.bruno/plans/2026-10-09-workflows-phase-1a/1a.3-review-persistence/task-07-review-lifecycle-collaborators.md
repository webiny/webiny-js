### Task 7: Review lifecycle collaborators — target loader, target sync, resolver, step reacher, single save path, events

**Files:**
- Create: `packages/api-workflows/src/features/review/ReviewTargetLoader/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewTargetLoader/index.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetSync/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewTargetSync/NoopReviewTargetSync.ts`, `packages/api-workflows/src/features/review/ReviewTargetSync/index.ts`
- Create: `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`, `packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts`, `packages/api-workflows/src/features/review/StepAssignmentResolver/index.ts`
- Create: `packages/api-workflows/src/features/review/ReviewStepReacher/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewStepReacher/ReviewStepReacher.ts`
- Create: `packages/api-workflows/src/features/review/ReviewSaver/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`
- Create: `packages/api-workflows/src/features/review/events.ts`
- Create: `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts`
- Modify: `packages/api-workflows/src/types.ts`, `packages/api-workflows/src/index.ts` (load the `ICmsEntrySystem` augmentation for consumers)
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingReviewTargetSync.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FailingReviewTargetSync.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`
- Create: `packages/api-workflows/__tests__/types.test.ts`

**Interfaces:**
- Consumes: `Review`, `ReviewData`, `ReviewFact`, `ReviewSystemWorkflow`, `StepAssignmentResolution`, `TargetContext`, `ReviewTargetSyncError` (Tasks 4-5), `ReviewRepository` (Task 6), `parseReviewStepConfig` (Task 2), `EventPublisher`, `DomainEvent`, `IEventHandler`.
- Produces:
  - `ReviewTargetLoader.Interface { canLoad(model: string): boolean; load(params: { model; targetId; targetRevisionId }): Promise<{ title: string; context: TargetContext } | null> }` (no implementation in 1a).
  - `ReviewTargetSync.Interface { sync(params: { review: ReviewData; systemWorkflow: ReviewSystemWorkflow | null }): Promise<Result<void, Error>> }` (R16); default `NoopReviewTargetSync` returns `Result.ok()`.
  - `StepAssignmentResolver.Interface { resolve(params: { review: ReviewData; step: ReviewStep }): Promise<StepAssignmentResolution> }`; default `PoolStepAssignmentResolver`.
  - `ReviewStepReacher.Interface { reach(params: { review: Review; actor: Actor; now: string }): Promise<Result<void, ReviewInvalidStateError>> }`.
  - `ReviewSaver.Interface { save(review: Review): Promise<Result<ReviewData, ReviewPersistenceError | ReviewTargetSyncError>> }`. Order: prepare, persist, sync, publish events. A failed sync does not undo the save: events are still published and `save` returns `ReviewTargetSyncError` with the saved review in `error.data.review` (R16). Event handler exceptions propagate.
  - Events in `@webiny/api-workflows/features/review/events.js`: `ReviewRequestedEvent`, `ReviewStepReachedEvent`, `ReviewStepStartedEvent`, `ReviewStepTakenOverEvent`, `ReviewStepApprovedEvent`, `ReviewStepRejectedEvent`, `ReviewCancelledEvent`, `ReviewApprovedEvent` (payload `ReviewEventPayload<TFact> { review: ReviewData; fact: TFact }`), handler abstractions `…EventHandler`, union `ReviewEvent`.
  - `ICmsEntrySystem.workflow?: ReviewSystemWorkflow | null` (module augmentation of `@webiny/api-headless-cms/types/types.js`), loaded by every consumer of `@webiny/api-workflows` through `export type * from "./types.js"` in `src/index.ts` (the pattern `api-websockets` and `website-builder-sdk` use).

- [ ] **Step 1: Write the sync recorder used by tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingReviewTargetSync.ts`:

```ts
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";

/** Every `ReviewTargetSync.sync` call while the decorator is registered. Reset per test. */
export const recordedSyncs: ReviewTargetSync.Params[] = [];

class RecordingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    constructor(private decoratee: ReviewTargetSync.Interface) {}

    async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        recordedSyncs.push(structuredClone(params));
        return this.decoratee.sync(params);
    }
}

export const RecordingReviewTargetSync = ReviewTargetSync.createDecorator({
    decorator: RecordingReviewTargetSyncImpl,
    dependencies: []
});
```

Create `packages/api-workflows/__tests__/__helpers/FailingReviewTargetSync.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";

export const TARGET_SYNC_FAILURE = "The target revision is locked.";

/** A target adapter whose write fails (R16), e.g. the target revision was deleted meanwhile. */
class FailingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    constructor(private decoratee: ReviewTargetSync.Interface) {}

    async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        await this.decoratee.sync(params);
        return Result.fail(new Error(TARGET_SYNC_FAILURE));
    }
}

export const FailingReviewTargetSync = ReviewTargetSync.createDecorator({
    decorator: FailingReviewTargetSyncImpl,
    dependencies: []
});
```

- [ ] **Step 2: Write the failing test**

Create `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    RecordingReviewTargetSync,
    recordedSyncs
} from "~tests/__helpers/RecordingReviewTargetSync.js";
import {
    FailingReviewTargetSync,
    TARGET_SYNC_FAILURE
} from "~tests/__helpers/FailingReviewTargetSync.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import type { ReviewStepReachedEvent } from "~/features/review/events.js";

const LATER = "2026-10-09T11:00:00.000Z";

const createRecordingContext = async () => {
    recordedEvents.length = 0;
    recordedSyncs.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingReviewTargetSync);
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    return context;
};

describe("ReviewSaver", () => {
    it("persists the review, syncs system.workflow, then publishes one event per fact", async () => {
        const context = await createRecordingContext();
        const review = createRequestedReview();

        const result = await context.container.resolve(ReviewSaver).save(review);

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            currentStepId: "legal",
            currentStepState: "awaiting",
            currentCandidateTeamIds: [REVIEW_TEAM_ID],
            lastChangedOn: NOW
        });
        const stored = await context.container.resolve(ReviewRepository).get(review.id);
        expect(stored.value).toEqual(result.value);
        expect(recordedSyncs).toEqual([
            {
                review: result.value,
                systemWorkflow: {
                    workflowId: "workflow-1",
                    reviewState: "inProgress",
                    stepId: "legal",
                    stepName: "Legal review",
                    stepState: "awaiting"
                }
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);
        const reached = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepReached"
        ) as ReviewStepReachedEvent;
        expect(reached.payload.review).toEqual(result.value);
        expect(reached.payload.fact).toEqual({
            type: "stepReached",
            occurredOn: NOW,
            actor: requester,
            owner: null,
            change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
            assignment: { source: "pool" }
        });
    });

    it("hands null to the target sync after cancel", async () => {
        const context = await createRecordingContext();
        const saver = context.container.resolve(ReviewSaver);
        const saved = expectOk(await saver.save(createRequestedReview()));
        recordedSyncs.length = 0;
        recordedEvents.length = 0;
        const review = Review.fromData(saved);
        expectOk(review.cancel({ actor: requester, now: LATER }));

        const result = await saver.save(review);

        expect(result.value).toMatchObject({
            state: "cancelled",
            isActive: false,
            currentStepId: null,
            lastChangedOn: LATER
        });
        expect(recordedSyncs.map(sync => sync.systemWorkflow)).toEqual([null]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);
    });

    it("keeps the review saved and publishes events when the target sync fails", async () => {
        recordedEvents.length = 0;
        recordedSyncs.length = 0;
        const { context } = await createContextHandler({
            setup: container => {
                container.registerDecorator(RecordingReviewTargetSync);
                container.registerDecorator(FailingReviewTargetSync);
                container.registerDecorator(RecordingEventPublisher);
            }
        });
        const review = createRequestedReview();

        const result = await context.container.resolve(ReviewSaver).save(review);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/TargetSync");
        expect(result.error.message).toBe(
            `The review was saved, but updating its content failed: ${TARGET_SYNC_FAILURE}`
        );
        const stored = expectOk(await context.container.resolve(ReviewRepository).get(review.id));
        expect(result.error.data).toEqual({ review: stored });
        expect(stored).toMatchObject({ currentStepId: "legal", currentStepState: "awaiting" });
        expect(recordedSyncs).toHaveLength(1);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);
    });
});

describe("Review lifecycle defaults", () => {
    it("ships a no-op target sync, no target loaders and a pool-only resolver", async () => {
        const { context } = await createContextHandler();
        const review = createRequestedReview({
            picks: [{ stepId: "legal", userId: "user-picked" }]
        }).toData();

        const synced = await context.container
            .resolve(ReviewTargetSync)
            .sync({ review, systemWorkflow: null });
        expect(synced.isOk()).toBe(true);
        expect(context.container.resolveAll(ReviewTargetLoader)).toEqual([]);

        const resolution = await context.container
            .resolve(StepAssignmentResolver)
            .resolve({ review, step: review.steps[0] });

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool" }
        });
    });

    it("reaches the current pending step through the resolver once", async () => {
        const { context } = await createContextHandler();
        const review = expectOk(
            Review.request({
                id: "review-1",
                workflow: createWorkflow(),
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0001",
                title: "Article 1",
                targetContext,
                picks: [],
                requester,
                now: NOW
            })
        );
        const reacher = context.container.resolve(ReviewStepReacher);

        const first = await reacher.reach({ review, actor: requester, now: NOW });
        const second = await reacher.reach({ review, actor: requester, now: NOW });

        expect(first.isOk()).toBe(true);
        expect(second.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            candidateTeamIds: [REVIEW_TEAM_ID]
        });
        expect(review.pullFacts().filter(fact => fact.type === "stepReached")).toHaveLength(1);
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/ReviewTargetSync/index.js`.

- [ ] **Step 4: Add the extension points**

Create `packages/api-workflows/src/features/review/ReviewTargetLoader/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { TargetContext } from "~/domain/review/types.js";

export interface ReviewTargetLoadParams {
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface ReviewTarget {
    title: string;
    context: TargetContext;
}

export interface IReviewTargetLoader {
    /** Whether this loader handles the namespace id, e.g. "cms.article" or "wb.page". */
    canLoad(model: string): boolean;
    /** The target revision's title and typed context; `null` when the revision does not exist. */
    load(params: ReviewTargetLoadParams): Promise<ReviewTarget | null>;
}

/**
 * Loads the content under review (spec 9.3). One implementation per namespace, registered by the
 * target adapters in phase 2; 1a ships none.
 */
export const ReviewTargetLoader = createAbstraction<IReviewTargetLoader>("ReviewTargetLoader");

export namespace ReviewTargetLoader {
    export type Interface = IReviewTargetLoader;
    export type LoadParams = ReviewTargetLoadParams;
    export type Target = ReviewTarget;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetLoader/index.ts`:

```ts
export { ReviewTargetLoader } from "./abstractions.js";
export type { ReviewTarget, ReviewTargetLoadParams } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/review/ReviewTargetSync/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData, ReviewSystemWorkflow } from "~/domain/review/types.js";

export interface ReviewTargetSyncParams {
    /** The review as persisted. */
    review: ReviewData;
    /** The new `system.workflow` value; `null` unlocks the target (cancel, D75). */
    systemWorkflow: ReviewSystemWorkflow | null;
}

export interface IReviewTargetSync {
    /** Fails with the adapter's error; the review stays saved (R16). */
    sync(params: ReviewTargetSyncParams): Promise<Result<void, Error>>;
}

/**
 * Writes `system.workflow` on the target after every review save (spec 4.5, D52). 1a registers a
 * no-op; phase 2 registers the target adapters' implementation (`UpdateEntrySystemUseCase`).
 */
export const ReviewTargetSync = createAbstraction<IReviewTargetSync>("ReviewTargetSync");

export namespace ReviewTargetSync {
    export type Interface = IReviewTargetSync;
    export type Params = ReviewTargetSyncParams;
    export type Return = Promise<Result<void, Error>>;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetSync/NoopReviewTargetSync.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "./abstractions.js";

/** Default until phase 2 registers the target adapters' sync. */
class NoopReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    async sync(): ReviewTargetSync.Return {
        return Result.ok();
    }
}

export const NoopReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: NoopReviewTargetSyncImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/features/review/ReviewTargetSync/index.ts`:

```ts
export { ReviewTargetSync } from "./abstractions.js";
export type { ReviewTargetSyncParams } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type {
    ReviewData,
    ReviewStep,
    StepAssignmentResolution
} from "~/domain/review/types.js";

export interface StepAssignmentResolverParams {
    review: ReviewData;
    /** The review step being reached; carries `pickedUserId` and the step config. */
    step: ReviewStep;
}

export interface IStepAssignmentResolver {
    resolve(params: StepAssignmentResolverParams): Promise<StepAssignmentResolution>;
}

/**
 * Decides who holds a review step when it is reached (spec 5.2, 6). 1a registers a pool-only
 * resolver; phase 4 replaces it with picks, rules and strategies.
 */
export const StepAssignmentResolver =
    createAbstraction<IStepAssignmentResolver>("StepAssignmentResolver");

export namespace StepAssignmentResolver {
    export type Interface = IStepAssignmentResolver;
    export type Params = StepAssignmentResolverParams;
    export type Resolution = StepAssignmentResolution;
}
```

Create `packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts`:

```ts
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { StepAssignmentResolver } from "./abstractions.js";

/** Every review step goes to its teams' pool; picks are stored but ignored until phase 4 (R3). */
class PoolStepAssignmentResolverImpl implements StepAssignmentResolver.Interface {
    async resolve(params: StepAssignmentResolver.Params): Promise<StepAssignmentResolver.Resolution> {
        // Save-time validation guarantees a parsable config. An unparsable one (edited storage)
        // leaves an empty pool; phase 5 fails such steps ("fail on invalid settings").
        const config = parseReviewStepConfig(params.step.config);
        return {
            owner: null,
            candidateTeamIds: config ? [...config.teams] : [],
            assignment: { source: "pool" }
        };
    }
}

export const PoolStepAssignmentResolver = StepAssignmentResolver.createImplementation({
    implementation: PoolStepAssignmentResolverImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/features/review/StepAssignmentResolver/index.ts`:

```ts
export { StepAssignmentResolver } from "./abstractions.js";
export type { StepAssignmentResolverParams } from "./abstractions.js";
```

- [ ] **Step 5: Add the step reacher**

Create `packages/api-workflows/src/features/review/ReviewStepReacher/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import type { ReviewInvalidStateError } from "~/domain/review/errors.js";

export interface ReviewStepReacherParams {
    review: Review;
    /** Who caused the step to be reached (requester, or approver of the previous step). */
    actor: Actor;
    now: string;
}

export interface IReviewStepReacher {
    reach(params: ReviewStepReacherParams): Promise<Result<void, ReviewInvalidStateError>>;
}

/**
 * The one code path for "step reached" (spec 5.2, D2, D6). No-op when the current step is not
 * pending. Phase 5 dispatches here by step type.
 */
export const ReviewStepReacher = createAbstraction<IReviewStepReacher>("ReviewStepReacher");

export namespace ReviewStepReacher {
    export type Interface = IReviewStepReacher;
    export type Params = ReviewStepReacherParams;
}
```

Create `packages/api-workflows/src/features/review/ReviewStepReacher/ReviewStepReacher.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ReviewInvalidStateError } from "~/domain/review/errors.js";
import { StepAssignmentResolver } from "../StepAssignmentResolver/abstractions.js";
import { ReviewStepReacher as Abstraction } from "./abstractions.js";

class ReviewStepReacherImpl implements Abstraction.Interface {
    constructor(private resolver: StepAssignmentResolver.Interface) {}

    async reach(params: Abstraction.Params): Promise<Result<void, ReviewInvalidStateError>> {
        const step = params.review.getStepToReach();
        if (!step) {
            return Result.ok();
        }
        const resolution = await this.resolver.resolve({ review: params.review.toData(), step });
        return params.review.reach({ resolution, actor: params.actor, now: params.now });
    }
}

export const ReviewStepReacher = Abstraction.createImplementation({
    implementation: ReviewStepReacherImpl,
    dependencies: [StepAssignmentResolver]
});
```

- [ ] **Step 6: Add the review events**

Create `packages/api-workflows/src/features/review/events.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewApprovedFact,
    ReviewCancelledFact,
    ReviewFact,
    ReviewRequestedFact,
    ReviewStepApprovedFact,
    ReviewStepReachedFact,
    ReviewStepRejectedFact,
    ReviewStepStartedFact,
    ReviewStepTakenOverFact
} from "~/domain/review/facts.js";

/**
 * Every review event carries the persisted review (ids, workflow snapshot, steps) and the fact
 * (actor, step id, from/to state, comment), enough for a later "Workflows" audit app (spec 9.5).
 */
export interface ReviewEventPayload<TFact extends ReviewFact> {
    review: ReviewData;
    fact: TFact;
}

// ============================================================================
// Requested
// ============================================================================

export class ReviewRequestedEvent extends DomainEvent<ReviewEventPayload<ReviewRequestedFact>> {
    eventType = "Workflows/Review/Requested" as const;

    getHandlerAbstraction() {
        return ReviewRequestedEventHandler;
    }
}

export const ReviewRequestedEventHandler = createAbstraction<IEventHandler<ReviewRequestedEvent>>(
    "ReviewRequestedEventHandler"
);

export namespace ReviewRequestedEventHandler {
    export type Interface = IEventHandler<ReviewRequestedEvent>;
    export type Event = ReviewRequestedEvent;
}

// ============================================================================
// StepReached
// ============================================================================

export class ReviewStepReachedEvent extends DomainEvent<ReviewEventPayload<ReviewStepReachedFact>> {
    eventType = "Workflows/Review/StepReached" as const;

    getHandlerAbstraction() {
        return ReviewStepReachedEventHandler;
    }
}

export const ReviewStepReachedEventHandler = createAbstraction<
    IEventHandler<ReviewStepReachedEvent>
>("ReviewStepReachedEventHandler");

export namespace ReviewStepReachedEventHandler {
    export type Interface = IEventHandler<ReviewStepReachedEvent>;
    export type Event = ReviewStepReachedEvent;
}

// ============================================================================
// StepStarted
// ============================================================================

export class ReviewStepStartedEvent extends DomainEvent<ReviewEventPayload<ReviewStepStartedFact>> {
    eventType = "Workflows/Review/StepStarted" as const;

    getHandlerAbstraction() {
        return ReviewStepStartedEventHandler;
    }
}

export const ReviewStepStartedEventHandler = createAbstraction<
    IEventHandler<ReviewStepStartedEvent>
>("ReviewStepStartedEventHandler");

export namespace ReviewStepStartedEventHandler {
    export type Interface = IEventHandler<ReviewStepStartedEvent>;
    export type Event = ReviewStepStartedEvent;
}

// ============================================================================
// StepTakenOver
// ============================================================================

export class ReviewStepTakenOverEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepTakenOverFact>
> {
    eventType = "Workflows/Review/StepTakenOver" as const;

    getHandlerAbstraction() {
        return ReviewStepTakenOverEventHandler;
    }
}

export const ReviewStepTakenOverEventHandler = createAbstraction<
    IEventHandler<ReviewStepTakenOverEvent>
>("ReviewStepTakenOverEventHandler");

export namespace ReviewStepTakenOverEventHandler {
    export type Interface = IEventHandler<ReviewStepTakenOverEvent>;
    export type Event = ReviewStepTakenOverEvent;
}

// ============================================================================
// StepApproved
// ============================================================================

export class ReviewStepApprovedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepApprovedFact>
> {
    eventType = "Workflows/Review/StepApproved" as const;

    getHandlerAbstraction() {
        return ReviewStepApprovedEventHandler;
    }
}

export const ReviewStepApprovedEventHandler = createAbstraction<
    IEventHandler<ReviewStepApprovedEvent>
>("ReviewStepApprovedEventHandler");

export namespace ReviewStepApprovedEventHandler {
    export type Interface = IEventHandler<ReviewStepApprovedEvent>;
    export type Event = ReviewStepApprovedEvent;
}

// ============================================================================
// StepRejected (the review is rejected with it, D10)
// ============================================================================

export class ReviewStepRejectedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepRejectedFact>
> {
    eventType = "Workflows/Review/StepRejected" as const;

    getHandlerAbstraction() {
        return ReviewStepRejectedEventHandler;
    }
}

export const ReviewStepRejectedEventHandler = createAbstraction<
    IEventHandler<ReviewStepRejectedEvent>
>("ReviewStepRejectedEventHandler");

export namespace ReviewStepRejectedEventHandler {
    export type Interface = IEventHandler<ReviewStepRejectedEvent>;
    export type Event = ReviewStepRejectedEvent;
}

// ============================================================================
// Cancelled
// ============================================================================

export class ReviewCancelledEvent extends DomainEvent<ReviewEventPayload<ReviewCancelledFact>> {
    eventType = "Workflows/Review/Cancelled" as const;

    getHandlerAbstraction() {
        return ReviewCancelledEventHandler;
    }
}

export const ReviewCancelledEventHandler = createAbstraction<IEventHandler<ReviewCancelledEvent>>(
    "ReviewCancelledEventHandler"
);

export namespace ReviewCancelledEventHandler {
    export type Interface = IEventHandler<ReviewCancelledEvent>;
    export type Event = ReviewCancelledEvent;
}

// ============================================================================
// Approved (the last step was approved)
// ============================================================================

export class ReviewApprovedEvent extends DomainEvent<ReviewEventPayload<ReviewApprovedFact>> {
    eventType = "Workflows/Review/Approved" as const;

    getHandlerAbstraction() {
        return ReviewApprovedEventHandler;
    }
}

export const ReviewApprovedEventHandler = createAbstraction<IEventHandler<ReviewApprovedEvent>>(
    "ReviewApprovedEventHandler"
);

export namespace ReviewApprovedEventHandler {
    export type Interface = IEventHandler<ReviewApprovedEvent>;
    export type Event = ReviewApprovedEvent;
}

export type ReviewEvent =
    | ReviewRequestedEvent
    | ReviewStepReachedEvent
    | ReviewStepStartedEvent
    | ReviewStepTakenOverEvent
    | ReviewStepApprovedEvent
    | ReviewStepRejectedEvent
    | ReviewCancelledEvent
    | ReviewApprovedEvent;
```

- [ ] **Step 7: Add the single save path**

Create `packages/api-workflows/src/features/review/ReviewSaver/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError, ReviewTargetSyncError } from "~/domain/review/errors.js";

export type ReviewSaverError = ReviewPersistenceError | ReviewTargetSyncError;

export interface IReviewSaver {
    save(review: Review): Promise<Result<ReviewData, ReviewSaverError>>;
}

/**
 * The single save path for reviews (R10, D19, D52): prepare the review-level fields, persist
 * (create or update), sync `system.workflow`, then publish one event per recorded fact. A failed
 * sync keeps the save and the events and returns `ReviewTargetSyncError` (R16).
 */
export const ReviewSaver = createAbstraction<IReviewSaver>("ReviewSaver");

export namespace ReviewSaver {
    export type Interface = IReviewSaver;
    export type Error = ReviewSaverError;
    export type Return = Promise<Result<ReviewData, ReviewSaverError>>;
}
```

Create `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewTargetSyncError } from "~/domain/review/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewTargetSync } from "../ReviewTargetSync/abstractions.js";
import {
    ReviewApprovedEvent,
    ReviewCancelledEvent,
    type ReviewEvent,
    ReviewRequestedEvent,
    ReviewStepApprovedEvent,
    ReviewStepReachedEvent,
    ReviewStepRejectedEvent,
    ReviewStepStartedEvent,
    ReviewStepTakenOverEvent
} from "../events.js";
import { ReviewSaver as Abstraction } from "./abstractions.js";

class ReviewSaverImpl implements Abstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private targetSync: ReviewTargetSync.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async save(review: Review): Abstraction.Return {
        review.prepareForSave();
        // Facts are pulled before persisting. If the save fails they are lost from this instance,
        // which is fine: every use case discards the instance after a failed save.
        const facts = review.pullFacts();

        // No optimistic locking on reviews (D27).
        const result = await this.repository.save(review.toData());
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        const saved = result.value;

        const synced = await this.targetSync.sync({
            review: saved,
            systemWorkflow: Review.fromData(saved).getSystemWorkflow()
        });

        // The review is saved, so its facts happened: publish them even when the sync failed
        // (R16). Handler exceptions propagate, as everywhere else in the repo.
        for (const fact of facts) {
            await this.eventPublisher.publish(this.createEvent(saved, fact));
        }

        if (synced.isFail()) {
            return Result.fail(new ReviewTargetSyncError({ review: saved, error: synced.error }));
        }
        return Result.ok(saved);
    }

    private createEvent(review: ReviewData, fact: ReviewFact): ReviewEvent {
        switch (fact.type) {
            case "requested":
                return new ReviewRequestedEvent({ review, fact });
            case "stepReached":
                return new ReviewStepReachedEvent({ review, fact });
            case "stepStarted":
                return new ReviewStepStartedEvent({ review, fact });
            case "stepTakenOver":
                return new ReviewStepTakenOverEvent({ review, fact });
            case "stepApproved":
                return new ReviewStepApprovedEvent({ review, fact });
            case "stepRejected":
                return new ReviewStepRejectedEvent({ review, fact });
            case "cancelled":
                return new ReviewCancelledEvent({ review, fact });
            case "approved":
                return new ReviewApprovedEvent({ review, fact });
        }
    }
}

export const ReviewSaver = Abstraction.createImplementation({
    implementation: ReviewSaverImpl,
    dependencies: [ReviewRepository, ReviewTargetSync, EventPublisher]
});
```

Create `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { NoopReviewTargetSync } from "./ReviewTargetSync/NoopReviewTargetSync.js";
import { PoolStepAssignmentResolver } from "./StepAssignmentResolver/PoolStepAssignmentResolver.js";
import { ReviewStepReacher } from "./ReviewStepReacher/ReviewStepReacher.js";
import { ReviewSaver } from "./ReviewSaver/ReviewSaver.js";

/**
 * Defaults for the review lifecycle. Later phases register their own `ReviewTargetSync` (2) and
 * `StepAssignmentResolver` (4) after `WorkflowsFeature`; the last registration wins on resolve.
 */
export const ReviewLifecycleFeature = createFeature({
    name: "Workflows/ReviewLifecycle",
    register(container) {
        container.register(NoopReviewTargetSync);
        container.register(PoolStepAssignmentResolver);
        container.register(ReviewStepReacher);
        container.register(ReviewSaver);
    }
});
```

- [ ] **Step 8: Type `system.workflow` on CMS entries**

Create `packages/api-workflows/__tests__/types.test.ts`:

```ts
import { describe, expect, expectTypeOf, it } from "vitest";
import type { ICmsEntrySystem } from "@webiny/api-headless-cms/types/types.js";
import type { ReviewSystemWorkflow } from "~/domain/review/types.js";
// Consumers see the augmentation through the package entry point, which re-exports `types.ts`.
import type { IWorkflowsSecurityPermission } from "~/index.js";

describe("ICmsEntrySystem augmentation", () => {
    it("types system.workflow as the review's system value", () => {
        expectTypeOf<ICmsEntrySystem["workflow"]>().toEqualTypeOf<
            ReviewSystemWorkflow | null | undefined
        >();
        expectTypeOf<IWorkflowsSecurityPermission["editor"]>().toEqualTypeOf<boolean>();

        const system: ICmsEntrySystem = {
            workflow: {
                workflowId: "workflow-1",
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "awaiting"
            }
        };

        expect(system.workflow?.stepState).toBe("awaiting");
    });
});
```

Replace `packages/api-workflows/src/types.ts` with:

```ts
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewSystemWorkflow } from "~/domain/review/types.js";

export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor: boolean;
}

declare module "@webiny/api-headless-cms/types/types.js" {
    export interface ICmsEntrySystem {
        /**
         * Review state of this revision (spec 4.5), written only through `ReviewTargetSync`.
         * Filterable via `CmsEntryListWhereSystemWorkflow` (phase 0).
         */
        workflow?: ReviewSystemWorkflow | null;
    }
}
```

Replace `packages/api-workflows/src/index.ts` with:

```ts
export { WorkflowsFeature } from "./WorkflowsFeature.js";
// Loads the `ICmsEntrySystem` augmentation for every consumer of the package.
export type * from "./types.js";
```

- [ ] **Step 9: Register the lifecycle**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import

```ts
import { ReviewLifecycleFeature } from "~/features/review/ReviewLifecycleFeature.js";
```

and replace the `// Reviews` block with:

```ts
        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
```

- [ ] **Step 10: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/types.test.ts 2>&1 | tail -50`
Expected: PASS (5 tests in `ReviewSaver.test.ts`, 1 in `types.test.ts`).
Run: `npx tsc --noEmit -p packages/api-workflows/tsconfig.json 2>&1 | grep "__tests__/types.test.ts" | head -20`
Expected: no output (`expectTypeOf` is checked by the compiler, not at runtime; the package tsconfig includes `__tests__`).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 11: Build dependents**

Run: `yarn build -p @webiny/api-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-headless-cms-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-website-builder-workflows 2>&1 | tail -30`
Expected: all succeed (the `ICmsEntrySystem` augmentation type-checks against `api-headless-cms`).

- [ ] **Step 12: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "feat(api-workflows): add the single review save path, target and assignment extension points

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
