### Task 9: Start, take over, approve, reject and cancel use cases

**Files:**
- Create: `packages/api-workflows/src/features/review/shared/types.ts`
- Create: `packages/api-workflows/src/features/review/StartReviewStep/{abstractions.ts,StartReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/TakeOverReviewStep/{abstractions.ts,TakeOverReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/ApproveReviewStep/{abstractions.ts,ApproveReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/RejectReviewStep/{abstractions.ts,RejectReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/CancelReview/{abstractions.ts,CancelReviewUseCase.ts,feature.ts,index.ts}`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewTransitions.test.ts`

**Interfaces:**
- Consumes: `ReviewRepository` (Task 6), `ReviewStepReacher`, `ReviewSaver` (Task 7), `Review` transitions (Tasks 4-5), test helpers (Task 8).
- Produces:
  - `ReviewActorInput { reviewId: string; stepId: string; actor: Actor; actorTeamIds: string[] }`, `ReviewDecisionInput extends ReviewActorInput { comment?: string | null }` (R17), `CancelReviewInput { reviewId: string; actor: Actor }` (cancel stays review-level). All three live in `review/shared/types.ts`.
  - `StartReviewStepUseCase.execute(input: ReviewActorInput)`, `TakeOverReviewStepUseCase.execute(input: ReviewActorInput)`, `ApproveReviewStepUseCase.execute(input: ReviewDecisionInput)`, `RejectReviewStepUseCase.execute(input: ReviewDecisionInput)`, `CancelReviewUseCase.execute(input: CancelReviewInput)`; each returns `Promise<Result<ReviewData, …>>` and persists only through `ReviewSaver`. Error unions add `Workflows/Review/StepNotCurrent` (start, take over, approve, reject), `Workflows/Review/ActorNotUser` (start, take over) and `Workflows/Review/TargetSync` (all five, R16). None reads `IdentityContext` (R6).

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/review/ReviewTransitions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { recordedEvents, workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import {
    expectOk,
    OTHER_TEAM_ID,
    otherReviewer,
    requester,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import type { Actor } from "~/domain/review/types.js";
import type {
    ReviewStepApprovedEvent,
    ReviewStepStartedEvent,
    ReviewStepTakenOverEvent
} from "~/features/review/events.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "~/features/review/TakeOverReviewStep/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";

const resetRecorders = (): void => {
    recordedSyncs.length = 0;
    recordedEvents.length = 0;
};

const syncedValues = () => {
    return recordedSyncs.map(sync => sync.systemWorkflow);
};

const setup = async () => {
    const { context, workflow } = await createReviewContext();
    const requestReview = context.container.resolve(RequestReviewUseCase);
    const requested = expectOk(await requestReview.execute(createRequestInput()));
    resetRecorders();
    const reviewId = requested.id;

    return {
        workflow,
        reviewId,
        requestReview,
        start: context.container.resolve(StartReviewStepUseCase),
        takeOver: context.container.resolve(TakeOverReviewStepUseCase),
        approve: context.container.resolve(ApproveReviewStepUseCase),
        reject: context.container.resolve(RejectReviewStepUseCase),
        cancel: context.container.resolve(CancelReviewUseCase),
        actorInput: (actor: Actor = reviewer, stepId = "legal") => ({
            reviewId,
            stepId,
            actor,
            actorTeamIds: [REVIEW_TEAM_ID]
        })
    };
};

describe("Review transitions", () => {
    it("starts the awaiting step and syncs the new step state", async () => {
        const { start, actorInput, workflow } = await setup();

        const result = await start.execute(actorInput());

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            currentStepState: "inReview",
            currentOwnerId: reviewer.id
        });
        expect(result.value.steps[0]).toMatchObject({
            owner: reviewer,
            assignment: { source: "poolStart" }
        });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "inReview"
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepStarted"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepStarted"
        ) as ReviewStepStartedEvent;
        expect(event.payload.fact.actor).toEqual(reviewer);
        expect(event.payload.review).toEqual(result.value);
    });

    it("does not let the requester, a non-member or a non-user start the step", async () => {
        const { start, actorInput, reviewId } = await setup();

        const byRequester = await start.execute(actorInput(requester));
        const byOutsider = await start.execute({
            reviewId,
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [OTHER_TEAM_ID]
        });
        const byAutomation = await start.execute(
            actorInput({ type: "automation", id: "user-reviewer", displayName: "Automation" })
        );

        expect(byRequester.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(byOutsider.error.code).toBe("Workflows/Review/NotCandidate");
        expect(byAutomation.error.code).toBe("Workflows/Review/ActorNotUser");
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("takes over a step from its owner and syncs it once", async () => {
        const { start, takeOver, actorInput, workflow } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await takeOver.execute(actorInput(otherReviewer));

        expect(result.isOk()).toBe(true);
        expect(result.value.currentOwnerId).toBe(otherReviewer.id);
        expect(result.value.steps[0].assignment).toEqual({
            source: "takeOver",
            by: otherReviewer
        });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "inReview"
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepTakenOver"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepTakenOver"
        ) as ReviewStepTakenOverEvent;
        expect(event.payload.fact.previousOwner).toEqual(reviewer);

        const again = await takeOver.execute(actorInput(otherReviewer));
        expect(again.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("does not let the requester or a non-member take over", async () => {
        const { start, takeOver, actorInput, reviewId } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const byRequester = await takeOver.execute(actorInput(requester));
        const byOutsider = await takeOver.execute({
            reviewId,
            stepId: "legal",
            actor: otherReviewer,
            actorTeamIds: [OTHER_TEAM_ID]
        });

        expect(byRequester.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(byOutsider.error.code).toBe("Workflows/Review/NotCandidate");
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("approving a step reaches the next one", async () => {
        const { start, approve, actorInput, workflow } = await setup();
        expectOk(await start.execute(actorInput()));
        const notOwner = await approve.execute({ ...actorInput(otherReviewer), comment: "Fine." });
        expect(notOwner.error.code).toBe("Workflows/Review/NotOwner");
        resetRecorders();

        const result = await approve.execute({ ...actorInput(), comment: "Looks good." });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "inProgress",
            currentStepId: "editorial",
            currentStepState: "awaiting",
            currentOwnerId: null
        });
        expect(result.value.steps[0]).toMatchObject({ state: "approved", comment: "Looks good." });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "editorial",
                stepName: "Editorial review",
                stepState: "awaiting"
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/StepReached"
        ]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepApproved"
        ) as ReviewStepApprovedEvent;
        expect(event.payload.fact.comment).toBe("Looks good.");
        expect(event.payload.fact.actor).toEqual(reviewer);
    });

    it("refuses a stale approve for a step that is no longer current", async () => {
        const { start, approve, actorInput } = await setup();
        expectOk(await start.execute(actorInput()));
        expectOk(await approve.execute(actorInput()));
        expectOk(await start.execute(actorInput(reviewer, "editorial")));
        resetRecorders();

        // A repeated "approve legal" must not approve "editorial", which the same user now holds.
        const stale = await approve.execute(actorInput());

        expect(stale.isFail()).toBe(true);
        expect(stale.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(stale.error.data).toMatchObject({ stepId: "legal", currentStepId: "editorial" });
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("approving the last step approves the review", async () => {
        const { start, approve, cancel, actorInput, reviewId, workflow } = await setup();
        expectOk(await start.execute(actorInput()));
        expectOk(await approve.execute(actorInput()));
        expectOk(await start.execute(actorInput(reviewer, "editorial")));
        resetRecorders();

        const result = await approve.execute(actorInput(reviewer, "editorial"));

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "approved",
            isActive: true,
            currentStepId: "editorial",
            currentStepState: "approved",
            currentOwnerId: reviewer.id
        });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "approved",
                stepId: "editorial",
                stepName: "Editorial review",
                stepState: "approved"
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/Approved"
        ]);

        const cancelled = await cancel.execute({ reviewId, actor: requester });
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("rejecting a step rejects the review for good", async () => {
        const { start, reject, approve, cancel, actorInput, reviewId, workflow } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await reject.execute({ ...actorInput(), comment: "Needs another pass." });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "rejected",
            isActive: true,
            currentStepId: "legal",
            currentStepState: "rejected",
            currentOwnerId: reviewer.id
        });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "rejected",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "rejected"
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepRejected"]);
        expect((await approve.execute(actorInput())).error.code).toBe("Workflows/Review/InvalidState");
        expect((await cancel.execute({ reviewId, actor: requester })).error.code).toBe(
            "Workflows/Review/InvalidState"
        );
    });

    it("cancelling clears the current step, unlocks the target and allows a new request", async () => {
        const { start, cancel, actorInput, reviewId, requestReview } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await cancel.execute({ reviewId, actor: requester });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "cancelled",
            isActive: false,
            currentStepId: null,
            currentStepState: null,
            currentOwnerId: null,
            currentCandidateTeamIds: []
        });
        expect(syncedValues()).toEqual([null]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);

        const again = await requestReview.execute(createRequestInput());
        expect(again.isOk()).toBe(true);
        expect(again.value.id).not.toBe(reviewId);
    });

    it("returns NotFound for an unknown review", async () => {
        const { start } = await setup();

        const result = await start.execute({
            reviewId: "missing",
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/StartReviewStep/index.js`.

- [ ] **Step 3: Add the shared input types**

Create `packages/api-workflows/src/features/review/shared/types.ts`:

```ts
import type { Actor } from "~/domain/review/types.js";

/** Input of step transitions. 1a takes the actor explicitly; 1b adds permission checks. */
export interface ReviewActorInput {
    reviewId: string;
    /** The step the caller acted on; fails with `StepNotCurrent` when it is not current (R17). */
    stepId: string;
    actor: Actor;
    /** The actor's teams, checked against the step's `candidateTeamIds` on start and take over. */
    actorTeamIds: string[];
}

export interface ReviewDecisionInput extends ReviewActorInput {
    comment?: string | null;
}

/** Cancel is review-level: no `stepId` (R17). */
export interface CancelReviewInput {
    reviewId: string;
    /** Requester or a user with `workflows.reassign`; checked in phase 1b. */
    actor: Actor;
}
```

- [ ] **Step 4: Add `StartReviewStep`**

Create `packages/api-workflows/src/features/review/StartReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewActorNotUserError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotCurrentError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { ReviewActorInput } from "../shared/types.js";

export interface IStartReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    actorNotUser: ReviewActorNotUserError;
    requesterCannotReview: ReviewRequesterCannotReviewError;
    notCandidate: ReviewNotCandidateError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IStartReviewStepUseCaseErrors[keyof IStartReviewStepUseCaseErrors];

export interface IStartReviewStepUseCase {
    execute(input: ReviewActorInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** A candidate takes an awaiting step from the pool (spec 5.1 "start"). */
export const StartReviewStepUseCase =
    createAbstraction<IStartReviewStepUseCase>("StartReviewStepUseCase");

export namespace StartReviewStepUseCase {
    export type Interface = IStartReviewStepUseCase;
    export type Input = ReviewActorInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/StartReviewStep/StartReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { StartReviewStepUseCase as UseCase } from "./abstractions.js";

class StartReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const started = review.start({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            now: new Date().toISOString()
        });
        if (started.isFail()) {
            return Result.fail(started.error);
        }

        return this.saver.save(review);
    }
}

export const StartReviewStepUseCase = UseCase.createImplementation({
    implementation: StartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/StartReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StartReviewStepUseCase } from "./StartReviewStepUseCase.js";

export const StartReviewStepFeature = createFeature({
    name: "Workflows/StartReviewStep",
    register(container) {
        container.register(StartReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/StartReviewStep/index.ts`:

```ts
export { StartReviewStepUseCase } from "./abstractions.js";
export type { ReviewActorInput } from "../shared/types.js";
```

- [ ] **Step 5: Add `TakeOverReviewStep`**

Create `packages/api-workflows/src/features/review/TakeOverReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewActorNotUserError,
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotCurrentError,
    ReviewStepNotTakeableError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { ReviewActorInput } from "../shared/types.js";

export interface ITakeOverReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    actorNotUser: ReviewActorNotUserError;
    requesterCannotReview: ReviewRequesterCannotReviewError;
    notCandidate: ReviewNotCandidateError;
    alreadyOwner: ReviewAlreadyOwnerError;
    stepNotTakeable: ReviewStepNotTakeableError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = ITakeOverReviewStepUseCaseErrors[keyof ITakeOverReviewStepUseCaseErrors];

export interface ITakeOverReviewStepUseCase {
    execute(input: ReviewActorInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Another candidate takes a human step in review (spec 5.1 "take over", D32, D9). */
export const TakeOverReviewStepUseCase = createAbstraction<ITakeOverReviewStepUseCase>(
    "TakeOverReviewStepUseCase"
);

export namespace TakeOverReviewStepUseCase {
    export type Interface = ITakeOverReviewStepUseCase;
    export type Input = ReviewActorInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/TakeOverReviewStep/TakeOverReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { TakeOverReviewStepUseCase as UseCase } from "./abstractions.js";

class TakeOverReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const takenOver = review.takeOver({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            now: new Date().toISOString()
        });
        if (takenOver.isFail()) {
            return Result.fail(takenOver.error);
        }

        return this.saver.save(review);
    }
}

export const TakeOverReviewStepUseCase = UseCase.createImplementation({
    implementation: TakeOverReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/TakeOverReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { TakeOverReviewStepUseCase } from "./TakeOverReviewStepUseCase.js";

export const TakeOverReviewStepFeature = createFeature({
    name: "Workflows/TakeOverReviewStep",
    register(container) {
        container.register(TakeOverReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/TakeOverReviewStep/index.ts`:

```ts
export { TakeOverReviewStepUseCase } from "./abstractions.js";
export type { ReviewActorInput } from "../shared/types.js";
```

- [ ] **Step 6: Add `ApproveReviewStep`**

Create `packages/api-workflows/src/features/review/ApproveReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewNotOwnerError,
    ReviewPersistenceError,
    ReviewStepNotCurrentError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { ReviewDecisionInput } from "../shared/types.js";

export interface IApproveReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    notOwner: ReviewNotOwnerError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IApproveReviewStepUseCaseErrors[keyof IApproveReviewStepUseCaseErrors];

export interface IApproveReviewStepUseCase {
    execute(input: ReviewDecisionInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** The owner approves the current step; the next step is reached, or the review is approved. */
export const ApproveReviewStepUseCase =
    createAbstraction<IApproveReviewStepUseCase>("ApproveReviewStepUseCase");

export namespace ApproveReviewStepUseCase {
    export type Interface = IApproveReviewStepUseCase;
    export type Input = ReviewDecisionInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/ApproveReviewStep/ApproveReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewStepReacher } from "../ReviewStepReacher/abstractions.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { ApproveReviewStepUseCase as UseCase } from "./abstractions.js";

class ApproveReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stepReacher: ReviewStepReacher.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);
        const now = new Date().toISOString();

        const approved = review.approve({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            comment: input.comment ?? null,
            now
        });
        if (approved.isFail()) {
            return Result.fail(approved.error);
        }

        // The next step goes through the same step-reached path as step 1 (D6).
        const reached = await this.stepReacher.reach({ review, actor: input.actor, now });
        if (reached.isFail()) {
            return Result.fail(reached.error);
        }

        return this.saver.save(review);
    }
}

export const ApproveReviewStepUseCase = UseCase.createImplementation({
    implementation: ApproveReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewStepReacher, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/ApproveReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ApproveReviewStepUseCase } from "./ApproveReviewStepUseCase.js";

export const ApproveReviewStepFeature = createFeature({
    name: "Workflows/ApproveReviewStep",
    register(container) {
        container.register(ApproveReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/ApproveReviewStep/index.ts`:

```ts
export { ApproveReviewStepUseCase } from "./abstractions.js";
export type { ReviewDecisionInput } from "../shared/types.js";
```

- [ ] **Step 7: Add `RejectReviewStep`**

Create `packages/api-workflows/src/features/review/RejectReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewNotOwnerError,
    ReviewPersistenceError,
    ReviewStepNotCurrentError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { ReviewDecisionInput } from "../shared/types.js";

export interface IRejectReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    notOwner: ReviewNotOwnerError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IRejectReviewStepUseCaseErrors[keyof IRejectReviewStepUseCaseErrors];

export interface IRejectReviewStepUseCase {
    execute(input: ReviewDecisionInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** The owner rejects the current step; the review is rejected for this revision (D10). */
export const RejectReviewStepUseCase =
    createAbstraction<IRejectReviewStepUseCase>("RejectReviewStepUseCase");

export namespace RejectReviewStepUseCase {
    export type Interface = IRejectReviewStepUseCase;
    export type Input = ReviewDecisionInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/RejectReviewStep/RejectReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { RejectReviewStepUseCase as UseCase } from "./abstractions.js";

class RejectReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const rejected = review.reject({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            comment: input.comment ?? null,
            now: new Date().toISOString()
        });
        if (rejected.isFail()) {
            return Result.fail(rejected.error);
        }

        return this.saver.save(review);
    }
}

export const RejectReviewStepUseCase = UseCase.createImplementation({
    implementation: RejectReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/RejectReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RejectReviewStepUseCase } from "./RejectReviewStepUseCase.js";

export const RejectReviewStepFeature = createFeature({
    name: "Workflows/RejectReviewStep",
    register(container) {
        container.register(RejectReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/RejectReviewStep/index.ts`:

```ts
export { RejectReviewStepUseCase } from "./abstractions.js";
export type { ReviewDecisionInput } from "../shared/types.js";
```

- [ ] **Step 8: Add `CancelReview`**

Create `packages/api-workflows/src/features/review/CancelReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { CancelReviewInput } from "../shared/types.js";

export interface ICancelReviewUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = ICancelReviewUseCaseErrors[keyof ICancelReviewUseCaseErrors];

export interface ICancelReviewUseCase {
    execute(input: CancelReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Cancel an in-progress review; the target is unlocked (D25, D75). */
export const CancelReviewUseCase = createAbstraction<ICancelReviewUseCase>("CancelReviewUseCase");

export namespace CancelReviewUseCase {
    export type Interface = ICancelReviewUseCase;
    export type Input = CancelReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/CancelReview/CancelReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { CancelReviewUseCase as UseCase } from "./abstractions.js";

class CancelReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const cancelled = review.cancel({ actor: input.actor, now: new Date().toISOString() });
        if (cancelled.isFail()) {
            return Result.fail(cancelled.error);
        }

        return this.saver.save(review);
    }
}

export const CancelReviewUseCase = UseCase.createImplementation({
    implementation: CancelReviewUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/CancelReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CancelReviewUseCase } from "./CancelReviewUseCase.js";

export const CancelReviewFeature = createFeature({
    name: "Workflows/CancelReview",
    register(container) {
        container.register(CancelReviewUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/CancelReview/index.ts`:

```ts
export { CancelReviewUseCase } from "./abstractions.js";
export type { CancelReviewInput } from "../shared/types.js";
```

- [ ] **Step 9: Register the use cases**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the imports

```ts
import { StartReviewStepFeature } from "~/features/review/StartReviewStep/feature.js";
import { TakeOverReviewStepFeature } from "~/features/review/TakeOverReviewStep/feature.js";
import { ApproveReviewStepFeature } from "~/features/review/ApproveReviewStep/feature.js";
import { RejectReviewStepFeature } from "~/features/review/RejectReviewStep/feature.js";
import { CancelReviewFeature } from "~/features/review/CancelReview/feature.js";
```

and replace the `// Reviews` block with:

```ts
        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
        RequestReviewFeature.register(container);
        GetReviewFeature.register(container);
        StartReviewStepFeature.register(container);
        TakeOverReviewStepFeature.register(container);
        ApproveReviewStepFeature.register(container);
        RejectReviewStepFeature.register(container);
        CancelReviewFeature.register(container);
```

- [ ] **Step 10: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS (10 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 11: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add start, take over, approve, reject and cancel review use cases

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
