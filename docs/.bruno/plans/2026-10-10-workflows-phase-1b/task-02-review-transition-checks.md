### Task 2: Review aggregate transition checks

**Files:**
- Modify: `packages/api-workflows/src/domain/review/errors.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Create: `packages/api-workflows/__tests__/domain/Review.checks.test.ts`

**Interfaces:**
- Consumes: the 1a `Review` aggregate and its private guards (`getCurrentStepIn`, `getRequestedStepIn`, `checkReviewer`, `getOwnedStep`, `findCurrentStep`), review errors, fixtures (`createRequestedReview`, `createStartedReview`, `createWorkflow`, `poolResolution`, `requester`, `reviewer`, `otherReviewer`, `aiActor`, `targetContext`, `ARTICLE_MODEL`, `REVIEW_TEAM_ID`, `OTHER_TEAM_ID`, `NOW`, `expectOk`).
- Produces (on `Review`, all pure: no fact, no mutation):
  - `get actionableStepId(): string | null` (first step not approved; `null` once every step is approved).
  - `isRequestedBy(actor: Actor): boolean` (`actor.type === "user"` and the requester's id; an AI or automation actor carries the requester's id (D58) and is never the requester).
  - `checkStart(params: ReviewActorCheckParams): Result<void, ReviewReviewerError>`
  - `checkTakeOver(params: ReviewActorCheckParams): Result<void, ReviewTakeOverError>`
  - `checkApprove(params: ReviewActorCheckParams): Result<void, ReviewDecisionError>`
  - `checkReject(params: ReviewActorCheckParams): Result<void, ReviewDecisionError>`
  - `checkCancel(): Result<void, ReviewInvalidStateError>`
  - `checkReassign(params: ReviewStepParams): Result<void, ReviewReassignError>` (step `awaiting` or human `inReview`, D33; phase 4's reassign transition must use the same private guard).
  - Param types: `ReviewStepParams { stepId: string }`, `ReviewActorCheckParams extends ReviewStepParams { actor: Actor; actorTeamIds: string[] }`, `ReviewActorParams extends ReviewActorCheckParams { now: string }` (same fields as in 1a), `ReviewDecisionParams extends ReviewActorParams { comment: string | null }` (unchanged).
  - `ReviewReassignError = ReviewInvalidStateError | ReviewStepNotCurrentError | ReviewStepNotReassignableError`.
  - `ReviewStepNotReassignableError` (`Workflows/Review/StepNotReassignable`, data `ReviewStepNotReassignableErrorData { reviewId, stepId, ownerType }`, its own name rather than the take-over error's data type, R44); `ReviewTransitionName` gains `"reassign"`.
  - Every transition runs the same private guard as its check (R31), so a check passes exactly when the transition would pass its domain rules.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/domain/Review.checks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import {
    aiActor,
    ARTICLE_MODEL,
    createRequestedReview,
    createStartedReview,
    createWorkflow,
    expectOk,
    NOW,
    OTHER_TEAM_ID,
    otherReviewer,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

interface CheckParamsOverrides {
    stepId?: string;
    actorTeamIds?: string[];
}

const checkParams = (actor: Actor, overrides: CheckParamsOverrides = {}) => {
    return {
        stepId: overrides.stepId ?? "legal",
        actor,
        actorTeamIds: overrides.actorTeamIds ?? [REVIEW_TEAM_ID]
    };
};

/** The first step ("legal") is owned by an AI actor from step reached. */
const createAiOwnedReview = (): Review => {
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
    expectOk(
        review.reach({
            resolution: {
                owner: aiActor,
                candidateTeamIds: [REVIEW_TEAM_ID],
                assignment: { source: "strategy" }
            },
            actor: requester,
            now: NOW
        })
    );
    review.pullFacts();
    return review;
};

describe("Review checks", () => {
    it("records nothing and changes nothing", () => {
        const review = createStartedReview();
        const before = review.toData();

        review.checkStart(checkParams(otherReviewer));
        review.checkTakeOver(checkParams(otherReviewer));
        review.checkApprove(checkParams(reviewer));
        review.checkReject(checkParams(reviewer));
        review.checkCancel();
        review.checkReassign({ stepId: "legal" });

        expect(review.toData()).toEqual(before);
        expect(review.pullFacts()).toEqual([]);
    });

    it("lets a candidate start an awaiting step and fails like start otherwise", () => {
        const review = createRequestedReview();
        review.pullFacts();

        expect(review.checkStart(checkParams(reviewer)).isOk()).toBe(true);
        expect(review.checkStart(checkParams(requester)).error.code).toBe(
            "Workflows/Review/RequesterCannotReview"
        );
        expect(
            review.checkStart(checkParams(otherReviewer, { actorTeamIds: [OTHER_TEAM_ID] })).error
                .code
        ).toBe("Workflows/Review/NotCandidate");
        expect(review.checkStart(checkParams(aiActor)).error.code).toBe(
            "Workflows/Review/ActorNotUser"
        );
        expect(review.checkStart(checkParams(reviewer, { stepId: "editorial" })).error.code).toBe(
            "Workflows/Review/StepNotCurrent"
        );
    });

    it("returns the same error as the start transition", () => {
        const checked = createRequestedReview().checkStart(checkParams(requester));
        const started = createRequestedReview().start({ ...checkParams(requester), now: LATER });

        expect(checked.error.code).toBe(started.error.code);
        expect(checked.error.data).toEqual(started.error.data);
    });

    it("lets another candidate take over and fails like take over otherwise", () => {
        const review = createStartedReview();

        expect(review.checkTakeOver(checkParams(otherReviewer)).isOk()).toBe(true);
        expect(review.checkTakeOver(checkParams(reviewer)).error.code).toBe(
            "Workflows/Review/AlreadyOwner"
        );
        expect(review.checkTakeOver(checkParams(requester)).error.code).toBe(
            "Workflows/Review/RequesterCannotReview"
        );
        expect(createAiOwnedReview().checkTakeOver(checkParams(otherReviewer)).error.code).toBe(
            "Workflows/Review/StepNotTakeable"
        );
    });

    it("lets only the owner approve or reject", () => {
        const review = createStartedReview();

        expect(review.checkApprove(checkParams(reviewer)).isOk()).toBe(true);
        expect(review.checkReject(checkParams(reviewer)).isOk()).toBe(true);
        expect(review.checkApprove(checkParams(otherReviewer)).error.code).toBe(
            "Workflows/Review/NotOwner"
        );
        expect(review.checkReject(checkParams(otherReviewer)).error.code).toBe(
            "Workflows/Review/NotOwner"
        );
        expect(createRequestedReview().checkApprove(checkParams(reviewer)).error.code).toBe(
            "Workflows/Review/InvalidState"
        );
    });

    it("allows cancel only while the review is in progress", () => {
        const review = createStartedReview();
        expect(review.checkCancel().isOk()).toBe(true);

        expectOk(review.cancel({ actor: requester, now: LATER }));

        const cancelled = review.checkCancel();
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
        expect(cancelled.error.data.transition).toBe("cancel");
    });

    it("allows reassign on an awaiting or human in-review step (D33)", () => {
        expect(createRequestedReview().checkReassign({ stepId: "legal" }).isOk()).toBe(true);
        expect(createStartedReview().checkReassign({ stepId: "legal" }).isOk()).toBe(true);
    });

    it("does not allow reassign on an AI step, a stale step or a finished review", () => {
        const aiOwned = createAiOwnedReview().checkReassign({ stepId: "legal" });
        expect(aiOwned.error.code).toBe("Workflows/Review/StepNotReassignable");
        expect(aiOwned.error.data).toEqual({
            reviewId: "review-1",
            stepId: "legal",
            ownerType: "ai"
        });

        expect(createRequestedReview().checkReassign({ stepId: "editorial" }).error.code).toBe(
            "Workflows/Review/StepNotCurrent"
        );

        const rejected = createStartedReview();
        expectOk(rejected.reject({ ...checkParams(reviewer), comment: null, now: LATER }));
        const finished = rejected.checkReassign({ stepId: "legal" });
        expect(finished.error.code).toBe("Workflows/Review/InvalidState");
        expect(finished.error.data).toMatchObject({ transition: "reassign" });
    });

    it("exposes the current step id until every step is approved", () => {
        const review = createStartedReview();
        expect(review.actionableStepId).toBe("legal");

        expectOk(review.approve({ ...checkParams(reviewer), comment: null, now: LATER }));
        expect(review.actionableStepId).toBe("editorial");

        expectOk(review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));
        expectOk(review.start({ ...checkParams(reviewer, { stepId: "editorial" }), now: LATER }));
        expectOk(
            review.approve({
                ...checkParams(reviewer, { stepId: "editorial" }),
                comment: null,
                now: LATER
            })
        );
        expect(review.actionableStepId).toBeNull();
    });

    it("treats only the requesting user as the requester", () => {
        const review = createRequestedReview();

        expect(review.isRequestedBy(requester)).toBe(true);
        // AI actors carry the requester's id (D58) but are not the requester.
        expect(review.isRequestedBy(aiActor)).toBe(false);
        expect(review.isRequestedBy(reviewer)).toBe(false);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.checks.test.ts 2>&1 | tail -50`
Expected: FAIL, `TypeError: review.checkStart is not a function` (and the same for the other checks, `actionableStepId` is `undefined`, `review.isRequestedBy is not a function`).

- [ ] **Step 3: Add the reassign error**

In `packages/api-workflows/src/domain/review/errors.ts`, replace

```ts
export type ReviewTransitionName = "reach" | "start" | "takeOver" | "approve" | "reject" | "cancel";
```

with

```ts
export type ReviewTransitionName =
    | "reach"
    | "start"
    | "takeOver"
    | "approve"
    | "reject"
    | "cancel"
    | "reassign";
```

and add after the `ReviewStepNotTakeableError` class:

```ts

export interface ReviewStepNotReassignableErrorData extends ReviewStepErrorData {
    ownerType: ActorType | null;
}

/** Reassign needs an `awaiting` or human-owned `inReview` step (D33). */
export class ReviewStepNotReassignableError extends BaseError<ReviewStepNotReassignableErrorData> {
    override readonly code = "Workflows/Review/StepNotReassignable" as const;

    constructor(data: ReviewStepNotReassignableErrorData) {
        super({ message: "AI and automation steps cannot be reassigned.", data });
    }
}
```

- [ ] **Step 4: Expose the checks on the aggregate**

Replace `packages/api-workflows/src/domain/review/Review.ts` with:

```ts
import { Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import type {
    Actor,
    ReviewData,
    ReviewPick,
    ReviewState,
    ReviewStep,
    ReviewSystemWorkflow,
    StepAssignmentResolution,
    StepState,
    TargetContext
} from "./types.js";
import type { ReviewFact } from "./facts.js";
import {
    ReviewActorNotUserError,
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotOwnerError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotCurrentError,
    ReviewStepNotReassignableError,
    ReviewStepNotTakeableError,
    type ReviewTransitionName,
    ReviewValidationError
} from "./errors.js";

/** `reason` on the pool assignment when a resolver returns the requester as owner (spec 5.1). */
const REQUESTER_OWNER_REASON =
    "The resolved owner is the requester, who cannot review their own content.";

export interface ReviewRequestParams {
    id: string;
    workflow: Workflow;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    targetContext: TargetContext;
    picks: ReviewPick[];
    requester: Actor;
    now: string;
}

export interface ReviewReachParams {
    resolution: StepAssignmentResolution;
    /** Who caused the step to be reached. */
    actor: Actor;
    now: string;
}

export interface ReviewStepParams {
    /** The step the caller acts on; must be the current step (R17). */
    stepId: string;
}

/** Who acts on the step. The checks take this; the transitions add `now`. */
export interface ReviewActorCheckParams extends ReviewStepParams {
    actor: Actor;
    /** Teams of the actor, resolved by the caller (the aggregate never reads identity, D5). */
    actorTeamIds: string[];
}

export interface ReviewActorParams extends ReviewActorCheckParams {
    now: string;
}

/** `actorTeamIds` is not read by approve or reject: only the owner decides (spec 5.1). */
export interface ReviewDecisionParams extends ReviewActorParams {
    comment: string | null;
}

export interface ReviewCancelParams {
    actor: Actor;
    now: string;
}

/** A human-held `inReview` step and its owner, as the take-over guard found them. */
interface ReviewHeldStep {
    step: ReviewStep;
    owner: Actor;
}

export type ReviewReviewerError =
    | ReviewInvalidStateError
    | ReviewStepNotCurrentError
    | ReviewActorNotUserError
    | ReviewRequesterCannotReviewError
    | ReviewNotCandidateError;

export type ReviewTakeOverError =
    | ReviewReviewerError
    | ReviewAlreadyOwnerError
    | ReviewStepNotTakeableError;

export type ReviewDecisionError =
    | ReviewInvalidStateError
    | ReviewStepNotCurrentError
    | ReviewNotOwnerError;

export type ReviewReassignError =
    | ReviewInvalidStateError
    | ReviewStepNotCurrentError
    | ReviewStepNotReassignableError;

/**
 * One run of a workflow on one target revision (spec 3, 4.2, 5.1). Transitions take an explicit
 * actor and `now`, never read identity, and record facts; `ReviewSaver` persists the review and
 * publishes one event per fact.
 *
 * Each transition has a pure `check*` twin that runs the same private guard (R31), so viewer
 * flags (spec 5.3) and the transitions cannot drift. Who may cancel or reassign is a permission
 * rule, not a domain rule: the app wrappers decide it with `canCancelByPermission` and
 * `canReassignByPermission` (D132, R41) and leave the state errors to these guards.
 */
export class Review {
    private readonly facts: ReviewFact[] = [];

    private constructor(private readonly data: ReviewData) {}

    public static fromData(data: ReviewData): Review {
        return new Review(structuredClone(data));
    }

    public static request(params: ReviewRequestParams): Result<Review, ReviewValidationError> {
        // Callers guarantee both (RequestReview queries by `models_in`, the validator requires a
        // step); checked here so the aggregate never holds a review it cannot progress.
        if (!params.workflow.models.includes(params.model)) {
            return Result.fail(
                new ReviewValidationError(
                    `The workflow "${params.workflow.name}" is not bound to the model "${params.model}".`
                )
            );
        }
        if (params.workflow.steps.length === 0) {
            return Result.fail(
                new ReviewValidationError(`The workflow "${params.workflow.name}" has no steps.`)
            );
        }

        const picks = new Map<string, string>();
        for (const pick of params.picks) {
            const step = params.workflow.steps.find(item => item.id === pick.stepId);
            if (!step) {
                return Result.fail(
                    new ReviewValidationError(
                        `Step "${pick.stepId}" does not exist in workflow "${params.workflow.name}".`
                    )
                );
            }
            const config = parseReviewStepConfig(step.config);
            if (!config || !config.assignment.allowManualPick) {
                return Result.fail(
                    new ReviewValidationError(
                        `Step "${step.title}" does not allow picking a reviewer.`
                    )
                );
            }
            if (picks.has(step.id)) {
                return Result.fail(
                    new ReviewValidationError(`Step "${step.title}" has more than one pick.`)
                );
            }
            picks.set(step.id, pick.userId);
        }

        const steps = params.workflow.steps.map((step): ReviewStep => ({
            ...structuredClone(step),
            state: "pending",
            owner: null,
            comment: null,
            pickedUserId: picks.get(step.id) ?? null,
            candidateTeamIds: [],
            assignmentSource: null,
            assignment: null,
            reachedOn: null,
            startedOn: null,
            finishedOn: null
        }));

        const review = new Review({
            id: params.id,
            workflowId: params.workflow.id,
            model: params.model,
            targetId: params.targetId,
            targetRevisionId: params.targetRevisionId,
            title: params.title,
            isActive: true,
            state: "inProgress",
            currentStepId: null,
            currentStepState: null,
            currentOwnerId: null,
            currentCandidateTeamIds: [],
            targetContext: structuredClone(params.targetContext),
            workflow: {
                name: params.workflow.name,
                models: [...params.workflow.models]
            },
            steps,
            createdBy: { ...params.requester },
            createdOn: params.now,
            savedOn: params.now,
            lastChangedOn: params.now
        });
        review.facts.push({
            type: "requested",
            occurredOn: params.now,
            actor: { ...params.requester }
        });
        return Result.ok(review);
    }

    public get id(): string {
        return this.data.id;
    }

    /** The step transitions act on: the first step that is not approved; `null` when all are. */
    public get actionableStepId(): string | null {
        return this.findCurrentStep()?.id ?? null;
    }

    public toData(): ReviewData {
        return structuredClone(this.data);
    }

    /**
     * The requester is a user. AI and automation actors carry the requester's id (D58) but are not
     * the requester.
     */
    public isRequestedBy(actor: Actor): boolean {
        return actor.type === "user" && actor.id === this.data.createdBy.id;
    }

    /** The current step when it still has to be reached (spec 5.2). */
    public getStepToReach(): ReviewStep | null {
        if (this.data.state !== "inProgress") {
            return null;
        }
        const step = this.findCurrentStep();
        if (!step || step.state !== "pending") {
            return null;
        }
        return structuredClone(step);
    }

    public reach(params: ReviewReachParams): Result<void, ReviewInvalidStateError> {
        const current = this.getCurrentStepIn("reach", "pending");
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const resolution = this.withoutRequesterOwner(params.resolution);

        step.candidateTeamIds = [...resolution.candidateTeamIds];
        step.assignment = structuredClone(resolution.assignment);
        step.assignmentSource = resolution.assignment.source;
        step.reachedOn = params.now;
        if (resolution.owner) {
            step.owner = { ...resolution.owner };
            step.state = "inReview";
            step.startedOn = params.now;
        } else {
            step.owner = null;
            step.state = "awaiting";
        }

        this.facts.push({
            type: "stepReached",
            occurredOn: params.now,
            actor: { ...params.actor },
            owner: step.owner ? { ...step.owner } : null,
            change: { stepId: step.id, fromState: "pending", toState: step.state },
            assignment: structuredClone(resolution.assignment)
        });
        return Result.ok();
    }

    public checkStart(params: ReviewActorCheckParams): Result<void, ReviewReviewerError> {
        return Review.toCheck(this.guardStart(params));
    }

    public start(params: ReviewActorParams): Result<void, ReviewReviewerError> {
        const guard = this.guardStart(params);
        if (guard.isFail()) {
            return Result.fail(guard.error);
        }
        const step = guard.value;

        step.owner = { ...params.actor };
        step.state = "inReview";
        step.startedOn = params.now;
        step.assignmentSource = "poolStart";
        step.assignment = { source: "poolStart" };

        this.facts.push({
            type: "stepStarted",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "awaiting", toState: "inReview" }
        });
        return Result.ok();
    }

    public checkTakeOver(params: ReviewActorCheckParams): Result<void, ReviewTakeOverError> {
        return Review.toCheck(this.guardTakeOver(params));
    }

    public takeOver(params: ReviewActorParams): Result<void, ReviewTakeOverError> {
        const guard = this.guardTakeOver(params);
        if (guard.isFail()) {
            return Result.fail(guard.error);
        }
        const { step, owner: previousOwner } = guard.value;

        step.owner = { ...params.actor };
        step.assignmentSource = "takeOver";
        step.assignment = { source: "takeOver", by: { ...params.actor } };

        this.facts.push({
            type: "stepTakenOver",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "inReview" },
            previousOwner: { ...previousOwner }
        });
        return Result.ok();
    }

    public checkApprove(params: ReviewActorCheckParams): Result<void, ReviewDecisionError> {
        return Review.toCheck(this.getOwnedStep("approve", params));
    }

    /** Owner (user, AI or automation) approves; the next step is reached by the caller (D6). */
    public approve(params: ReviewDecisionParams): Result<void, ReviewDecisionError> {
        const current = this.getOwnedStep("approve", params);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;

        step.state = "approved";
        step.comment = params.comment;
        step.finishedOn = params.now;
        this.facts.push({
            type: "stepApproved",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "approved" },
            comment: params.comment
        });

        if (this.data.steps.every(item => item.state === "approved")) {
            this.data.state = "approved";
            this.facts.push({
                type: "approved",
                occurredOn: params.now,
                actor: { ...params.actor }
            });
        }
        return Result.ok();
    }

    public checkReject(params: ReviewActorCheckParams): Result<void, ReviewDecisionError> {
        return Review.toCheck(this.getOwnedStep("reject", params));
    }

    /** Owner rejects; reject is final for the revision (D10). */
    public reject(params: ReviewDecisionParams): Result<void, ReviewDecisionError> {
        const current = this.getOwnedStep("reject", params);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;

        step.state = "rejected";
        step.comment = params.comment;
        step.finishedOn = params.now;
        this.data.state = "rejected";
        this.facts.push({
            type: "stepRejected",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "rejected" },
            comment: params.comment
        });
        return Result.ok();
    }

    public checkCancel(): Result<void, ReviewInvalidStateError> {
        return Review.toCheck(this.guardCancel());
    }

    /**
     * Allowed while the review is in progress (D25, D75). Who may cancel (requester or
     * `reassign`, D54) is checked by the app wrapper with `canCancelByPermission` (D132, R41).
     */
    public cancel(params: ReviewCancelParams): Result<void, ReviewInvalidStateError> {
        const guard = this.guardCancel();
        if (guard.isFail()) {
            return Result.fail(guard.error);
        }
        const step = guard.value;

        this.data.state = "cancelled";
        this.facts.push({
            type: "cancelled",
            occurredOn: params.now,
            actor: { ...params.actor },
            stepId: step?.id ?? null,
            stepState: step?.state ?? null
        });
        return Result.ok();
    }

    /**
     * Reassign is possible on an `awaiting` or human-owned `inReview` step (D33). The transition
     * arrives in phase 4 and must use the same guard; who may reassign (`reassign`) is checked by
     * the app wrapper with `canReassignByPermission` (D132, R41).
     */
    public checkReassign(params: ReviewStepParams): Result<void, ReviewReassignError> {
        return Review.toCheck(this.guardReassign(params));
    }

    /**
     * Called by the single save path before persisting (D19). Derives the review-level fields from
     * the steps; `lastChangedOn` moves only when a review event happened (D119), and never
     * backwards: it becomes the later of the stored value and the newest unpulled fact. Cancel
     * moves it too: D119 does not list cancel, but a cancelled review leaves every list
     * (`isActive: false`), so this is harmless and keeps the field monotonic.
     */
    public prepareForSave(): void {
        const lastFact = this.facts[this.facts.length - 1];
        if (lastFact && Date.parse(lastFact.occurredOn) > Date.parse(this.data.lastChangedOn)) {
            this.data.lastChangedOn = lastFact.occurredOn;
        }

        const current = this.resolveCurrentStep();
        if (!current) {
            // Cancelled (D75): the review leaves every list and the target is unlocked.
            this.data.isActive = false;
            this.data.currentStepId = null;
            this.data.currentStepState = null;
            this.data.currentOwnerId = null;
            this.data.currentCandidateTeamIds = [];
            return;
        }
        this.data.isActive = true;
        this.data.state = Review.deriveState(current);
        this.data.currentStepId = current.id;
        this.data.currentStepState = current.state;
        this.data.currentOwnerId = current.owner?.type === "user" ? current.owner.id : null;
        this.data.currentCandidateTeamIds = [...current.candidateTeamIds];
    }

    /**
     * `system.workflow` for the target revision (spec 4.5). Derived from the steps, so it does not
     * depend on `prepareForSave` having run.
     */
    public getSystemWorkflow(): ReviewSystemWorkflow | null {
        const current = this.resolveCurrentStep();
        if (!current) {
            return null;
        }
        return {
            workflowId: this.data.workflowId,
            reviewState: Review.deriveState(current),
            stepId: current.id,
            stepName: current.title,
            stepState: current.state
        };
    }

    /** Returns and clears the facts recorded since the last call. */
    public pullFacts(): ReviewFact[] {
        return this.facts.splice(0, this.facts.length);
    }

    private guardStart(params: ReviewActorCheckParams): Result<ReviewStep, ReviewReviewerError> {
        const current = this.getRequestedStepIn("start", "awaiting", params.stepId);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const reviewer = this.checkReviewer(step, params);
        if (reviewer.isFail()) {
            return Result.fail(reviewer.error);
        }
        return Result.ok(step);
    }

    private guardTakeOver(
        params: ReviewActorCheckParams
    ): Result<ReviewHeldStep, ReviewTakeOverError> {
        const current = this.getRequestedStepIn("takeOver", "inReview", params.stepId);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const owner = step.owner;
        if (!owner || owner.type !== "user") {
            // AI and automation steps cannot be taken over (D9).
            return Result.fail(
                new ReviewStepNotTakeableError({
                    reviewId: this.data.id,
                    stepId: step.id,
                    ownerType: owner?.type ?? null
                })
            );
        }
        const reviewer = this.checkReviewer(step, params);
        if (reviewer.isFail()) {
            return Result.fail(reviewer.error);
        }
        if (owner.id === params.actor.id) {
            return Result.fail(
                new ReviewAlreadyOwnerError({ reviewId: this.data.id, stepId: step.id })
            );
        }
        return Result.ok({ step, owner });
    }

    /** The current step (if any) of a review that can still be cancelled. */
    private guardCancel(): Result<ReviewStep | null, ReviewInvalidStateError> {
        const step = this.findCurrentStep();
        if (this.data.state !== "inProgress") {
            return Result.fail(
                new ReviewInvalidStateError({
                    reviewId: this.data.id,
                    transition: "cancel",
                    reviewState: this.data.state,
                    stepId: step?.id ?? null,
                    stepState: step?.state ?? null
                })
            );
        }
        return Result.ok(step);
    }

    private guardReassign(params: ReviewStepParams): Result<ReviewStep, ReviewReassignError> {
        const awaiting = this.getRequestedStepIn("reassign", "awaiting", params.stepId);
        if (awaiting.isOk()) {
            return Result.ok(awaiting.value);
        }
        const inReview = this.getRequestedStepIn("reassign", "inReview", params.stepId);
        if (inReview.isFail()) {
            return Result.fail(inReview.error);
        }
        const step = inReview.value;
        if (step.owner?.type !== "user") {
            return Result.fail(
                new ReviewStepNotReassignableError({
                    reviewId: this.data.id,
                    stepId: step.id,
                    ownerType: step.owner?.type ?? null
                })
            );
        }
        return Result.ok(step);
    }

    /** Turns a guard's result into a check's result: same error, no step. */
    private static toCheck<TError>(guard: Result<unknown, TError>): Result<void, TError> {
        if (guard.isFail()) {
            return Result.fail(guard.error);
        }
        return Result.ok();
    }

    /** The first step that is not approved; null when every step is approved. */
    private findCurrentStep(): ReviewStep | null {
        return this.data.steps.find(step => step.state !== "approved") ?? null;
    }

    private getCurrentStepIn(
        transition: ReviewTransitionName,
        stepState: StepState
    ): Result<ReviewStep, ReviewInvalidStateError> {
        const step = this.findCurrentStep();
        if (this.data.state !== "inProgress" || !step || step.state !== stepState) {
            return Result.fail(
                new ReviewInvalidStateError({
                    reviewId: this.data.id,
                    transition,
                    reviewState: this.data.state,
                    stepId: step?.id ?? null,
                    stepState: step?.state ?? null
                })
            );
        }
        return Result.ok(step);
    }

    /**
     * Like `getCurrentStepIn`, for transitions that name the step they act on (R17). While the
     * review is in progress, a `stepId` other than the current step fails with `StepNotCurrent`.
     */
    private getRequestedStepIn(
        transition: ReviewTransitionName,
        stepState: StepState,
        stepId: string
    ): Result<ReviewStep, ReviewInvalidStateError | ReviewStepNotCurrentError> {
        const current = this.findCurrentStep();
        if (this.data.state === "inProgress" && current && current.id !== stepId) {
            return Result.fail(
                new ReviewStepNotCurrentError({
                    reviewId: this.data.id,
                    stepId,
                    currentStepId: current.id
                })
            );
        }
        return this.getCurrentStepIn(transition, stepState);
    }

    /** The requester never reviews their own content (spec 5.1): such an owner goes to the pool. */
    private withoutRequesterOwner(resolution: StepAssignmentResolution): StepAssignmentResolution {
        const owner = resolution.owner;
        if (!owner || !this.isRequestedBy(owner)) {
            return resolution;
        }
        return {
            owner: null,
            candidateTeamIds: [...resolution.candidateTeamIds],
            assignment: { source: "pool", reason: REQUESTER_OWNER_REASON }
        };
    }

    /**
     * The step the review-level fields and `system.workflow` describe: the first step that is not
     * approved, else the last step (after approve the last step stays current, after reject the
     * rejecting step, D75). `null` for cancelled reviews. `request` guarantees at least one step.
     */
    private resolveCurrentStep(): ReviewStep | null {
        if (this.data.state === "cancelled") {
            return null;
        }
        return this.findCurrentStep() ?? this.data.steps.at(-1) ?? null;
    }

    private getOwnedStep(
        transition: ReviewTransitionName,
        params: ReviewActorCheckParams
    ): Result<ReviewStep, ReviewDecisionError> {
        const current = this.getRequestedStepIn(transition, "inReview", params.stepId);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const actor = params.actor;
        const owner = step.owner;
        if (!owner || owner.type !== actor.type || owner.id !== actor.id) {
            return Result.fail(
                new ReviewNotOwnerError({ reviewId: this.data.id, stepId: step.id })
            );
        }
        return Result.ok(step);
    }

    private static deriveState(current: ReviewStep): ReviewState {
        if (current.state === "rejected") {
            return "rejected";
        }
        if (current.state === "approved") {
            return "approved";
        }
        return "inProgress";
    }

    /** Human actions: a user, not the requester, member of the step's candidate teams (spec 5.1). */
    private checkReviewer(
        step: ReviewStep,
        params: ReviewActorCheckParams
    ): Result<
        void,
        ReviewActorNotUserError | ReviewRequesterCannotReviewError | ReviewNotCandidateError
    > {
        if (params.actor.type !== "user") {
            return Result.fail(
                new ReviewActorNotUserError({
                    reviewId: this.data.id,
                    stepId: step.id,
                    actorType: params.actor.type
                })
            );
        }
        if (this.isRequestedBy(params.actor)) {
            return Result.fail(
                new ReviewRequesterCannotReviewError({ reviewId: this.data.id, stepId: step.id })
            );
        }
        const isCandidate = params.actorTeamIds.some(teamId =>
            step.candidateTeamIds.includes(teamId)
        );
        if (!isCandidate) {
            return Result.fail(
                new ReviewNotCandidateError({ reviewId: this.data.id, stepId: step.id })
            );
        }
        return Result.ok();
    }
}
```

Behaviour notes for the reviewer of this task:
- `withoutRequesterOwner` now uses `isRequestedBy`, which is the same condition as before (`type === "user"` and the requester's id).
- `checkReviewer` runs `isRequestedBy` after the `type === "user"` check, so it equals the old id comparison.
- `takeOver` keeps the error order of 1a: state and `stepId`, not takeable, reviewer rules, already owner.
- The take-over guard returns the step with its user owner (`ReviewHeldStep`), so `takeOver` needs no cast to read the previous owner.

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain 2>&1 | tail -50`
Expected: PASS (`Review.checks.test.ts` 10 tests, and every 1a domain test unchanged).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: not runnable locally (A9); record "not run" and leave it to CI.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "refactor(api-workflows): expose the review aggregate's transition checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
