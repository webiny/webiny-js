### Task 4: Reassign transition and `ReassignReviewStepUseCase`

Spec 5.1 (reassign row and rules), 6, 4.3; D25, D33, D54, D61, D89, D97, D133; R109, R112, R117, R119; A49. Reassign arrives as a real transition:

- Aggregate `Review.reassign({ stepId, actor, owner, now })` runs the existing private `guardReassign` (the same guard as `checkReassign`, R31): an `awaiting` step or a human-owned `inReview` step, else `InvalidState` / `StepNotCurrent` / `StepNotReassignable`. Reassigning to the current owner (same type and id) fails with `ReviewAlreadyOwnerError`. `awaiting` becomes `inReview` with `startedOn = now`; an `inReview` step keeps its `startedOn`. The step gets the new owner, `assignmentSource: "reassign"` and `assignment: { source: "reassign", by: actor }`. A new `stepReassigned` fact (with `owner`, `previousOwner: Actor | null` and one `reassign` outcome record with `by`, R117) becomes `ReviewStepReassignedEvent` (`Workflows/Review/StepReassigned`) in `ReviewSaver`, and the pure `toAssignmentRecordValues` gets its case, so `ReviewSaver` writes the record after the save (4.1 Task 1).
- Engine `ReassignReviewStepUseCase.execute({ reviewId, stepId, userId, actor })` (internal, D132: no permission check; the 4.3 / 4.4 wrappers check `reassign` and the caller's read access). It loads the review, runs `checkReassign` first (a refused state costs no lookup), then validates the chosen user like a pick through `RoutingEvaluatorService.checkUser` (4.1 Task 2, R112): not the requester, a member of the step's `candidateTeamIds`, not actively excluded, can read the target revision (read check as the request identity, SEC-66). An invalid user fails with the new `ReviewReassignTargetInvalidError` (`Workflows/Review/ReassignTargetInvalid`, data `{ reviewId, stepId, userId, reason }`, `reason` one of the four fixed R112 reasons, never an exclusion's own text, D89, D97). The owner actor is built from the directory user: `{ type: "user", id, displayName, identityType: "admin" }`. A failed lookup is `RoutingDependencyError`; a throwing port (read check, users) is caught and returned as `RoutingDependencyError` too, so the use case never rejects.
- `now` is taken once (`new Date()`) and used for exclusion expiry and the transition.

Tests run on 4.1 Task 2's routing fakes (`createRoutingContext`) with the fake target loader and the event recorder, so the read checks, the users lookup and the exclusions are controlled.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/errors.ts`
- Modify: `packages/api-workflows/src/domain/review/facts.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/domain/assignment/toAssignmentRecordValues.ts`
- Modify: `packages/api-workflows/src/features/review/events.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`
- Create: `packages/api-workflows/src/features/review/ReassignReviewStep/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ReassignReviewStep/ReassignReviewStepUseCase.ts`
- Create: `packages/api-workflows/src/features/review/ReassignReviewStep/feature.ts`
- Create: `packages/api-workflows/src/features/review/ReassignReviewStep/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/domain/Review.reassign.test.ts`
- Create: `packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes:
  - 4.1 Task 1: `AssignmentDecision { kind; userId: string | null; source: AssignmentSource; ruleId: string | null; by: Actor | null; reason: string | null }` (`~/domain/assignment/types.js`); `toAssignmentRecordValues(review: ReviewData, fact: ReviewFact): AssignmentRecordValues[]` (`~/domain/assignment/toAssignmentRecordValues.js`, a `switch` over every fact type); `ReviewStepTakenOverFact.records`; `ReviewSaver` writes `toAssignmentRecordValues(saved, fact)` for every fact after the save; `poolResolution()` returns `records: [poolOutcomeRecord()]`.
  - 4.1 Task 2: `RoutingEvaluatorService` (`~/features/routing/RoutingEvaluatorService/index.js`), `checkUser(params: RoutingUserCheckParams): Promise<Result<RoutingUserCheck, RoutingDependencyError>>` (may throw), `RoutingUserCheckParams { userId: string; teamIds: string[]; requesterId: string; model: string; read: RoutingReadScope; now: Date }`, `RoutingUserCheck { user: RoutingUser | null; skipReason: RoutingSkipReason | null }`, `RoutingReadScope` (`{ type: "target"; targetId; targetRevisionId }`); `RoutingDependencyError(error: PersistenceErrorSource)` (`~/domain/routing/errors.js`, `Workflows/Routing/Dependency`); `ROUTING_SKIP_REASONS` (`~/domain/routing/reasons.js`). Test helpers: `createRoutingContext(params?)` → `{ context, users, teams, settings }`, `resetRoutingFakes()`, `ROUTING_USERS` (anna, bob, cara in `REVIEW_TEAM_ID`; dan in `OTHER_TEAM_ID`; the requester in `REVIEW_TEAM_ID`) (`~tests/__helpers/routingContext.js`); `FakeListUsers` (`calls: { input: ListUsersInput; authorizationEnabled: boolean | null }[]`, `failuresLeft`); `FakeWorkflowSettings.exclusions`; `readableUsers`, `readChecks`, `throwingReadChecks` (`~tests/__helpers/FakeReviewTargetReadAccess.js`).
  - Existing: `Review.checkReassign`, private `guardReassign`, `ReviewReassignError`, `ReviewAlreadyOwnerError`, `ReviewSaver`, `ReviewRepository.get`, `FakeReviewTargetLoader`, `RecordingEventPublisher`, `createRequestInput`, `StoreWorkflowUseCase`.
- Produces:
  - `Review.reassign(params: ReviewReassignParams): Result<void, ReviewReassignTransitionError>`; `ReviewReassignParams extends ReviewStepParams { actor: Actor; owner: Actor; now: string }`; `type ReviewReassignTransitionError = ReviewReassignError | ReviewAlreadyOwnerError` (`~/domain/review/Review.js`).
  - `ReviewStepReassignedFact { type: "stepReassigned"; occurredOn: string; actor: Actor; change: ReviewStepChange; owner: Actor; previousOwner: Actor | null; records: AssignmentDecision[] }` in the `ReviewFact` union (`~/domain/review/facts.js`).
  - `ReviewStepReassignedEvent` (`eventType "Workflows/Review/StepReassigned"`), `ReviewStepReassignedEventHandler` (`~/features/review/events.js`), in the `ReviewEvent` union.
  - `ReviewReassignTargetInvalidError` (`Workflows/Review/ReassignTargetInvalid`, data `ReviewReassignTargetInvalidErrorData { reviewId: string; stepId: string; userId: string; reason: string }`, message `This user cannot review this step: <reason>`) (`~/domain/review/errors.js`).
  - `ReassignReviewStepUseCase` (`~/features/review/ReassignReviewStep/index.js`), `execute(input: ReassignReviewStepInput): Promise<Result<ReviewData, ReassignReviewStepUseCase.Error>>`, `ReassignReviewStepInput { reviewId: string; stepId: string; userId: string; actor: Actor }`, `Error` = `ReviewNotFoundError | ReviewPersistenceError | ReviewInvalidStateError | ReviewStepNotCurrentError | ReviewStepNotReassignableError | ReviewAlreadyOwnerError | ReviewReassignTargetInvalidError | RoutingDependencyError | ReviewTargetSyncError`. Feature `ReassignReviewStepFeature`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/domain/Review.reassign.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import { toAssignmentRecordValues } from "~/domain/assignment/toAssignmentRecordValues.js";
import {
    aiActor,
    createRequestedReview,
    createStartedReview,
    expectOk,
    NOW,
    otherReviewer,
    requester,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

/** Holds `workflows.reassign`; not a member of any team. */
const manager: Actor = {
    type: "user",
    id: "user-manager",
    displayName: "Mona Manager",
    identityType: "admin"
};

const newOwner: Actor = {
    type: "user",
    id: "user-anna",
    displayName: "Anna",
    identityType: "admin"
};

describe("Review.reassign (spec 5.1, D33, R119)", () => {
    it("moves an awaiting step to the chosen user and records a reassign outcome", () => {
        const review = createRequestedReview();
        review.pullFacts();

        expectOk(review.reassign({ stepId: "legal", actor: manager, owner: newOwner, now: LATER }));

        const [step] = review.toData().steps;
        expect(step).toMatchObject({
            state: "inReview",
            owner: newOwner,
            startedOn: LATER,
            assignmentSource: "reassign",
            assignment: { source: "reassign", by: manager }
        });
        const facts = review.pullFacts();
        expect(facts).toEqual([
            {
                type: "stepReassigned",
                occurredOn: LATER,
                actor: manager,
                change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
                owner: newOwner,
                previousOwner: null,
                records: [
                    {
                        kind: "outcome",
                        userId: newOwner.id,
                        source: "reassign",
                        ruleId: null,
                        by: manager,
                        reason: null
                    }
                ]
            }
        ]);
    });

    it("takes a step in review from its owner and keeps when it started", () => {
        const review = createStartedReview();

        expectOk(review.reassign({ stepId: "legal", actor: manager, owner: newOwner, now: LATER }));

        const [step] = review.toData().steps;
        expect(step).toMatchObject({ state: "inReview", owner: newOwner, startedOn: NOW });
        const [fact] = review.pullFacts();
        expect(fact).toMatchObject({
            type: "stepReassigned",
            change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
            previousOwner: reviewer
        });
    });

    it("lets the owner's own reassign go to someone else", () => {
        const review = createStartedReview();

        const result = review.reassign({
            stepId: "legal",
            actor: reviewer,
            owner: otherReviewer,
            now: LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0].owner).toEqual(otherReviewer);
    });

    it("refuses the current owner and records nothing", () => {
        const review = createStartedReview();

        const result = review.reassign({
            stepId: "legal",
            actor: manager,
            owner: reviewer,
            now: LATER
        });

        expect(result.error.code).toBe("Workflows/Review/AlreadyOwner");
        expect(result.error.data).toEqual({ reviewId: "review-1", stepId: "legal" });
        expect(review.pullFacts()).toEqual([]);
        expect(review.toData().steps[0].owner).toEqual(reviewer);
    });

    it("uses the reassign guard: AI step, other step, finished review", () => {
        const aiData = toSaveData(createStartedReview());
        aiData.steps[0].owner = { ...aiActor };
        const aiOwned = Review.fromData(aiData);
        const otherStep = createRequestedReview();
        const cancelled = createRequestedReview();
        expectOk(cancelled.cancel({ actor: requester, now: NOW }));

        const byAi = aiOwned.reassign({ stepId: "legal", actor: manager, owner: newOwner, now: LATER });
        const byStep = otherStep.reassign({
            stepId: "editorial",
            actor: manager,
            owner: newOwner,
            now: LATER
        });
        const byState = cancelled.reassign({
            stepId: "legal",
            actor: manager,
            owner: newOwner,
            now: LATER
        });

        expect(byAi.error.code).toBe("Workflows/Review/StepNotReassignable");
        expect(byStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(byState.error.code).toBe("Workflows/Review/InvalidState");
        expect(aiOwned.toData().steps[0].owner).toEqual(aiActor);
    });

    it("turns the reassigned fact into one record of the review, step and time (R117)", () => {
        const review = toSaveData(createRequestedReview());
        const fact: ReviewFact = {
            type: "stepReassigned",
            occurredOn: LATER,
            actor: manager,
            change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
            owner: newOwner,
            previousOwner: null,
            records: [
                {
                    kind: "outcome",
                    userId: newOwner.id,
                    source: "reassign",
                    ruleId: null,
                    by: manager,
                    reason: null
                }
            ]
        };

        expect(toAssignmentRecordValues(review, fact)).toEqual([
            {
                kind: "outcome",
                userId: newOwner.id,
                source: "reassign",
                ruleId: null,
                by: manager,
                reason: null,
                reviewId: "review-1",
                workflowId: "workflow-1",
                stepId: "legal",
                assignedOn: LATER
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createRoutingContext, resetRoutingFakes } from "~tests/__helpers/routingContext.js";
import { FakeReviewTargetLoader } from "~tests/__helpers/FakeReviewTargetLoader.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import { createRequestInput } from "~tests/__helpers/reviewContext.js";
import {
    createWorkflowValues,
    editor,
    expectOk,
    requester,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import type { Actor } from "~/domain/review/types.js";
import type { ReviewStepReassignedEvent } from "~/features/review/events.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { ReassignReviewStepUseCase } from "~/features/review/ReassignReviewStep/index.js";

/** Holds `workflows.reassign` in the wrapper; the engine only records it (D132). */
const manager: Actor = {
    type: "user",
    id: "user-manager",
    displayName: "Mona Manager",
    identityType: "admin"
};

const ANNA_OWNER: Actor = {
    type: "user",
    id: "user-anna",
    displayName: "Anna",
    identityType: "admin"
};

const setup = async () => {
    const routing = await createRoutingContext({
        setup: container => {
            container.register(FakeReviewTargetLoader);
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    const { container } = routing.context;
    expectOk(
        await container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createWorkflowValues(), actor: editor })
    );
    const review = expectOk(
        await container.resolve(RequestReviewUseCase).execute(createRequestInput())
    );
    recordedEvents.length = 0;
    readChecks.length = 0;
    routing.users.calls.length = 0;
    return {
        ...routing,
        review,
        reassign: container.resolve(ReassignReviewStepUseCase),
        listRecords: async () => {
            const listed = await container
                .resolve(AssignmentRepository)
                .list({ where: { reviewId: review.id } });
            return expectOk(listed).items;
        }
    };
};

describe("ReassignReviewStepUseCase (spec 5.1, R112, R119)", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("reassigns an awaiting step to a valid candidate and writes a reassign record", async () => {
        const { reassign, review, users, listRecords } = await setup();
        readableUsers.add("user-anna");

        const reassigned = expectOk(
            await reassign.execute({
                reviewId: review.id,
                stepId: "legal",
                userId: "user-anna",
                actor: manager
            })
        );

        expect(reassigned).toMatchObject({ currentStepState: "inReview", currentOwnerId: "user-anna" });
        expect(reassigned.steps[0]).toMatchObject({
            state: "inReview",
            owner: ANNA_OWNER,
            assignmentSource: "reassign",
            assignment: { source: "reassign", by: manager }
        });
        expect(users.calls).toEqual([
            {
                input: { where: { id_in: ["user-anna"], teams_in: [REVIEW_TEAM_ID] } },
                authorizationEnabled: false
            }
        ]);
        expect(readChecks).toEqual([
            {
                userId: "user-anna",
                scope: "target",
                targetRevisionId: review.targetRevisionId,
                folderId: null,
                authorizationEnabled: true
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepReassigned"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepReassigned"
        ) as ReviewStepReassignedEvent;
        expect(event.payload.fact).toMatchObject({
            actor: manager,
            owner: ANNA_OWNER,
            previousOwner: null
        });
        const record = (await listRecords()).find(item => item.source === "reassign");
        expect(record).toMatchObject({
            kind: "outcome",
            stepId: "legal",
            userId: "user-anna",
            ruleId: null,
            by: manager,
            reason: null,
            assignedOn: reassigned.steps[0].startedOn
        });
    });

    it("reassigns a step in review away from its owner", async () => {
        const { context, reassign, review } = await setup();
        expectOk(
            await context.container.resolve(StartReviewStepUseCase).execute({
                reviewId: review.id,
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID]
            })
        );
        recordedEvents.length = 0;
        readableUsers.add("user-bob");

        const reassigned = expectOk(
            await reassign.execute({
                reviewId: review.id,
                stepId: "legal",
                userId: "user-bob",
                actor: manager
            })
        );

        expect(reassigned.steps[0].owner).toEqual({
            type: "user",
            id: "user-bob",
            displayName: "Bob",
            identityType: "admin"
        });
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepReassigned"
        ) as ReviewStepReassignedEvent;
        expect(event.payload.fact.previousOwner).toEqual(reviewer);
    });

    it("refuses an invalid user with the fixed reason and saves nothing (R112)", async () => {
        const { context, reassign, review, settings } = await setup();
        readableUsers.add("user-anna");
        readableUsers.add("user-cara");
        readableUsers.add("user-dan");
        readableUsers.add(requester.id);
        settings.exclusions = [{ userId: "user-cara", reason: "On leave" }];
        const attempt = (userId: string) => {
            return reassign.execute({ reviewId: review.id, stepId: "legal", userId, actor: manager });
        };

        const byRequester = await attempt(requester.id);
        const byOutsider = await attempt("user-dan");
        const byExcluded = await attempt("user-cara");
        const byUnreadable = await attempt("user-bob");

        expect(byRequester.error.code).toBe("Workflows/Review/ReassignTargetInvalid");
        expect(byRequester.error.data).toEqual({
            reviewId: review.id,
            stepId: "legal",
            userId: requester.id,
            reason: "The requester cannot review."
        });
        expect(byOutsider.error.data).toMatchObject({ reason: "Not a member of the step's teams." });
        expect(byExcluded.error.data).toMatchObject({ reason: "Excluded from reviews." });
        expect(byExcluded.error.message).toBe(
            "This user cannot review this step: Excluded from reviews."
        );
        expect(byUnreadable.error.data).toMatchObject({ reason: "Cannot read this content." });
        expect(workflowEventTypes()).toEqual([]);
        const stored = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.steps[0]).toMatchObject({ state: "awaiting", owner: null });
    });

    it("refuses the current owner", async () => {
        const { reassign, review } = await setup();
        readableUsers.add("user-anna");
        const input = { reviewId: review.id, stepId: "legal", userId: "user-anna", actor: manager };
        expectOk(await reassign.execute(input));

        const again = await reassign.execute(input);

        expect(again.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("checks the review state before any lookup", async () => {
        const { context, reassign, review, users } = await setup();
        readableUsers.add("user-anna");

        const otherStep = await reassign.execute({
            reviewId: review.id,
            stepId: "editorial",
            userId: "user-anna",
            actor: manager
        });
        expectOk(
            await context.container
                .resolve(CancelReviewUseCase)
                .execute({ reviewId: review.id, actor: requester })
        );
        const cancelled = await reassign.execute({
            reviewId: review.id,
            stepId: "legal",
            userId: "user-anna",
            actor: manager
        });
        const missing = await reassign.execute({
            reviewId: "review-missing",
            stepId: "legal",
            userId: "user-anna",
            actor: manager
        });

        expect(otherStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
        expect(missing.error.code).toBe("Workflows/Review/NotFound");
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("returns the routing dependency error when a lookup fails or a read check throws", async () => {
        const { reassign, review, users } = await setup();
        throwingReadChecks.add("user-anna");
        const input = { reviewId: review.id, stepId: "legal", userId: "user-anna", actor: manager };

        users.failuresLeft = 1;
        const failed = await reassign.execute(input);
        const thrown = await reassign.execute(input);

        expect(failed.error.code).toBe("Workflows/Routing/Dependency");
        expect(failed.error.message).toBe("Storage is not available.");
        expect(thrown.error.code).toBe("Workflows/Routing/Dependency");
        expect(thrown.error.message).toBe("The read check crashed.");
        expect(workflowEventTypes()).toEqual([]);
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts`, add after the `TakeOverReviewStepUseCase` import:

```ts
import { ReassignReviewStepUseCase } from "~/features/review/ReassignReviewStep/index.js";
```

and after `expect(container.resolveAll(TakeOverReviewStepUseCase)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(ReassignReviewStepUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.reassign.test.ts packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. `Review.reassign.test.ts` fails with `review.reassign is not a function` (and the record test with `undefined` instead of the records, since the switch in `toAssignmentRecordValues` has no `stepReassigned` case and falls through); the other two cannot resolve `~/features/review/ReassignReviewStep/index.js`.

- [ ] **Step 3: The error, the fact and the transition**

In `packages/api-workflows/src/domain/review/errors.ts`, add after the `ReviewStepNotReassignableError` class:

```ts

export interface ReviewReassignTargetInvalidErrorData extends ReviewStepErrorData {
    userId: string;
    /** One of the fixed routing reasons (R112), never an exclusion's own text (D89, D97). */
    reason: string;
}

/** The chosen user fails the pick rules: requester, not a member, excluded, cannot read (D33, R119). */
export class ReviewReassignTargetInvalidError extends BaseError<ReviewReassignTargetInvalidErrorData> {
    override readonly code = "Workflows/Review/ReassignTargetInvalid" as const;

    constructor(data: ReviewReassignTargetInvalidErrorData) {
        super({ message: `This user cannot review this step: ${data.reason}`, data });
    }
}
```

In `packages/api-workflows/src/domain/review/facts.ts`, add after the `ReviewStepTakenOverFact` interface:

```ts

export interface ReviewStepReassignedFact {
    type: "stepReassigned";
    occurredOn: string;
    /** Who reassigned: a user with `workflows.reassign` (the wrapper checked it, D132). */
    actor: Actor;
    change: ReviewStepChange;
    /** The chosen user. */
    owner: Actor;
    /** `null` when the step was `awaiting`. */
    previousOwner: Actor | null;
    /** One `reassign` outcome with `by` (R117). */
    records: AssignmentDecision[];
}
```

and replace the union:

```ts
export type ReviewFact =
    | ReviewRequestedFact
    | ReviewStepReachedFact
    | ReviewStepStartedFact
    | ReviewStepTakenOverFact
    | ReviewStepApprovedFact
```

with

```ts
export type ReviewFact =
    | ReviewRequestedFact
    | ReviewStepReachedFact
    | ReviewStepStartedFact
    | ReviewStepTakenOverFact
    | ReviewStepReassignedFact
    | ReviewStepApprovedFact
```

(`AssignmentDecision` is already imported there by 4.1 Task 1.)

In `packages/api-workflows/src/domain/review/Review.ts`:

Add after the `ReviewCancelParams` interface:

```ts

export interface ReviewReassignParams extends ReviewStepParams {
    /** Who reassigns; recorded as `by` (D127). */
    actor: Actor;
    /** The chosen user, validated by the caller (R112, R119). */
    owner: Actor;
    now: string;
}
```

Add after the `ReviewReassignError` type:

```ts

/** Reassign adds the same-owner rule to the reassign guard. */
export type ReviewReassignTransitionError = ReviewReassignError | ReviewAlreadyOwnerError;
```

Replace the JSDoc and `checkReassign`:

```ts
    /**
     * Reassign is possible on an `awaiting` or human-owned `inReview` step (D33). The transition
     * arrives in phase 4 and must use the same guard; who may reassign (`reassign`) is checked by
     * the app wrapper with `canReassignByPermission` (D132, R41).
     */
    public checkReassign(params: ReviewStepParams): Result<void, ReviewReassignError> {
        return Review.toCheck(this.guardReassign(params));
    }
```

with

```ts
    /**
     * Reassign is possible on an `awaiting` or human-owned `inReview` step (D33). Who may reassign
     * (`reassign`) is checked by the app wrapper with `canReassignByPermission` (D132, R41).
     */
    public checkReassign(params: ReviewStepParams): Result<void, ReviewReassignError> {
        return Review.toCheck(this.guardReassign(params));
    }

    /**
     * Gives the step to the chosen user (spec 5.1, R119), through the same guard as
     * `checkReassign`. The caller has validated the user like a pick (R112). An `awaiting` step
     * starts now; an `inReview` step keeps its `startedOn`.
     */
    public reassign(params: ReviewReassignParams): Result<void, ReviewReassignTransitionError> {
        const guard = this.guardReassign(params);
        if (guard.isFail()) {
            return Result.fail(guard.error);
        }
        const step = guard.value;
        const previousOwner = step.owner;
        if (
            previousOwner &&
            previousOwner.type === params.owner.type &&
            previousOwner.id === params.owner.id
        ) {
            return Result.fail(
                new ReviewAlreadyOwnerError({ reviewId: this.data.id, stepId: step.id })
            );
        }
        const fromState = step.state;

        step.owner = { ...params.owner };
        if (fromState === "awaiting") {
            step.state = "inReview";
            step.startedOn = params.now;
        }
        step.assignmentSource = "reassign";
        step.assignment = { source: "reassign", by: { ...params.actor } };

        this.facts.push({
            type: "stepReassigned",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState, toState: "inReview" },
            owner: { ...params.owner },
            previousOwner: previousOwner ? { ...previousOwner } : null,
            records: [
                {
                    kind: "outcome",
                    userId: params.owner.id,
                    source: "reassign",
                    ruleId: null,
                    by: { ...params.actor },
                    reason: null
                }
            ]
        });
        return Result.ok();
    }
```

In `packages/api-workflows/src/domain/assignment/toAssignmentRecordValues.ts`, replace

```ts
        case "stepReached":
        case "stepStarted":
        case "stepTakenOver":
```

with

```ts
        case "stepReached":
        case "stepStarted":
        case "stepTakenOver":
        case "stepReassigned":
```

and in its JSDoc replace `start and take over carry one` with `start, take over and reassign carry one`.

- [ ] **Step 4: The event**

In `packages/api-workflows/src/features/review/events.ts`, add `ReviewStepReassignedFact` to the facts import list (after `ReviewStepReachedFact`), add after the `StepTakenOver` section:

```ts

// ============================================================================
// StepReassigned
// ============================================================================

export class ReviewStepReassignedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepReassignedFact>
> {
    eventType = "Workflows/Review/StepReassigned" as const;

    getHandlerAbstraction() {
        return ReviewStepReassignedEventHandler;
    }
}

export const ReviewStepReassignedEventHandler = createAbstraction<
    IEventHandler<ReviewStepReassignedEvent>
>("ReviewStepReassignedEventHandler");

export namespace ReviewStepReassignedEventHandler {
    export type Interface = IEventHandler<ReviewStepReassignedEvent>;
    export type Event = ReviewStepReassignedEvent;
}
```

and in the `ReviewEvent` union add `| ReviewStepReassignedEvent` after `| ReviewStepTakenOverEvent`.

In `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`, add `ReviewStepReassignedEvent,` to the `../events.js` import list (after `ReviewStepReachedEvent,`), and in `createEvent` add after the `stepTakenOver` case:

```ts
            case "stepReassigned":
                return new ReviewStepReassignedEvent({ review, fact });
```

- [ ] **Step 5: The use case**

Create `packages/api-workflows/src/features/review/ReassignReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import type {
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewReassignTargetInvalidError,
    ReviewStepNotCurrentError,
    ReviewStepNotReassignableError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";

export interface ReassignReviewStepInput {
    reviewId: string;
    /** The step the caller acted on; fails with `StepNotCurrent` when it is not current (R17). */
    stepId: string;
    /** The chosen user; validated like a pick (R112). */
    userId: string;
    /** Who reassigns; the wrapper checked `workflows.reassign` and read access (D132). */
    actor: Actor;
}

export interface IReassignReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    stepNotReassignable: ReviewStepNotReassignableError;
    alreadyOwner: ReviewAlreadyOwnerError;
    targetInvalid: ReviewReassignTargetInvalidError;
    routing: RoutingDependencyError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IReassignReviewStepUseCaseErrors[keyof IReassignReviewStepUseCaseErrors];

export interface IReassignReviewStepUseCase {
    execute(input: ReassignReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Gives an `awaiting` or human-held step to a chosen user (spec 5.1 "reassign", D33, R119).
 * Internal (D132): the app wrapper checks `workflows.reassign` and read access. The engine checks
 * the chosen user like a pick (R112): not the requester, a member of the step's candidate teams,
 * not excluded, can read the target.
 */
export const ReassignReviewStepUseCase = createAbstraction<IReassignReviewStepUseCase>(
    "ReassignReviewStepUseCase"
);

export namespace ReassignReviewStepUseCase {
    export type Interface = IReassignReviewStepUseCase;
    export type Input = ReassignReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/ReassignReviewStep/ReassignReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewReassignTargetInvalidError } from "~/domain/review/errors.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { ROUTING_SKIP_REASONS } from "~/domain/routing/reasons.js";
import type { RoutingUserCheck } from "~/domain/routing/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { ReassignReviewStepUseCase as UseCase } from "./abstractions.js";

class ReassignReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private routing: RoutingEvaluatorService.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const data = loaded.value;
        const review = Review.fromData(data);

        // The state rules first: a refused reassign costs no user lookup or read check.
        const allowed = review.checkReassign({ stepId: input.stepId });
        if (allowed.isFail()) {
            return Result.fail(allowed.error);
        }
        const step = data.steps.find(item => item.id === input.stepId);
        const now = new Date();

        // The chosen user is validated like a pick (R112); the read check runs as the request
        // identity inside the service (SEC-66). A throwing port is a routing failure too.
        let checked: Result<RoutingUserCheck, RoutingDependencyError>;
        try {
            checked = await this.routing.checkUser({
                userId: input.userId,
                teamIds: [...(step?.candidateTeamIds ?? [])],
                requesterId: data.createdBy.id,
                model: data.model,
                read: {
                    type: "target",
                    targetId: data.targetId,
                    targetRevisionId: data.targetRevisionId
                },
                now
            });
        } catch (error) {
            return Result.fail(
                new RoutingDependencyError(error instanceof Error ? error : new Error(String(error)))
            );
        }
        if (checked.isFail()) {
            return Result.fail(checked.error);
        }
        const { user, skipReason } = checked.value;
        if (skipReason || !user) {
            return Result.fail(
                new ReviewReassignTargetInvalidError({
                    reviewId: data.id,
                    stepId: input.stepId,
                    userId: input.userId,
                    reason: skipReason ?? ROUTING_SKIP_REASONS.notMember
                })
            );
        }

        const reassigned = review.reassign({
            stepId: input.stepId,
            actor: input.actor,
            owner: {
                type: "user",
                id: user.id,
                displayName: user.displayName,
                identityType: "admin"
            },
            now: now.toISOString()
        });
        if (reassigned.isFail()) {
            return Result.fail(reassigned.error);
        }

        return this.saver.save(review);
    }
}

export const ReassignReviewStepUseCase = UseCase.createImplementation({
    implementation: ReassignReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, RoutingEvaluatorService, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/ReassignReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReassignReviewStepUseCase } from "./ReassignReviewStepUseCase.js";

export const ReassignReviewStepFeature = createFeature({
    name: "Workflows/ReassignReviewStep",
    register(container) {
        container.register(ReassignReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/ReassignReviewStep/index.ts`:

```ts
export { ReassignReviewStepUseCase } from "./abstractions.js";
export type { ReassignReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 6: Register**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add after the `TakeOverReviewStepFeature` import:

```ts
import { ReassignReviewStepFeature } from "~/features/review/ReassignReviewStep/feature.js";
```

and after `TakeOverReviewStepFeature.register(container);`:

```ts
        ReassignReviewStepFeature.register(container);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.reassign.test.ts packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts packages/api-workflows/__tests__/registration.test.ts packages/api-workflows/__tests__/domain/Review.checks.test.ts packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/domain/Review.reassign.test.ts packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts packages/api-workflows/__tests__/registration.test.ts packages/api-workflows/__tests__/domain/Review.checks.test.ts packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the reassign transition and the engine reassign use case

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
