### Task 4: Review aggregate — request, reach, start, take over

**Files:**
- Create: `packages/api-workflows/src/domain/review/types.ts`
- Create: `packages/api-workflows/src/domain/review/facts.ts`
- Create: `packages/api-workflows/src/domain/review/errors.ts`
- Create: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/fixtures.ts` (full replacement below)
- Create: `packages/api-workflows/__tests__/domain/Review.request.test.ts`

**Interfaces:**
- Consumes: `Workflow`, `WorkflowStep` (Task 2), `parseReviewStepConfig` (Task 2), `Result`, `BaseError` (`@webiny/feature/api`).
- Produces:
  - Types: `ReviewState`, `StepState`, `ActorType`, `Actor`, `ReviewStepAssignment`, `ReviewStep`, `ReviewWorkflowSnapshot`, `TargetContext`, `TargetContextFolder`, `TargetContextAuthor`, `ReviewData`, `ReviewPick`, `StepAssignmentResolution`, `ReviewSystemWorkflow`.
  - Facts: `ReviewFact` union (`requested`, `stepReached`, `stepStarted`, `stepTakenOver`, `stepApproved`, `stepRejected`, `cancelled`, `approved`) and `ReviewStepChange`.
  - Errors (`Workflows/Review/...`): `NotFound`, `Persistence`, `Validation`, `InvalidState`, `StepNotCurrent` (data `{ reviewId, stepId, currentStepId }`, R17), `ActorNotUser` (data `{ reviewId, stepId, actorType }`), `RequesterCannotReview`, `NotCandidate`, `AlreadyOwner`, `NotOwner`, `StepNotTakeable`, `AlreadyActive`, `WorkflowNotFound`, `TargetNotFound`, `TargetSync` (class `ReviewTargetSyncError`, data `{ review: ReviewData }`, R16; used by Task 7).
  - `ReviewActorParams { stepId: string; actor: Actor; actorTeamIds: string[]; now: string }` (R17: `stepId` must be the current step).
  - `ReviewReviewerError = ReviewInvalidStateError | ReviewStepNotCurrentError | ReviewActorNotUserError | ReviewRequesterCannotReviewError | ReviewNotCandidateError`; `ReviewTakeOverError = ReviewReviewerError | ReviewAlreadyOwnerError | ReviewStepNotTakeableError`.
  - `class Review`:
    - `static request(params: ReviewRequestParams): Result<Review, ReviewValidationError>` (fails when `params.model` is not in `workflow.models`, the workflow has no steps, or a pick is invalid or duplicated)
    - `static fromData(data: ReviewData): Review`, `toData(): ReviewData`, `get id(): string`
    - `getStepToReach(): ReviewStep | null`
    - `reach(params: ReviewReachParams): Result<void, ReviewInvalidStateError>` (a resolved `user` owner who is the requester falls back to the pool with a `reason`)
    - `start(params: ReviewActorParams): Result<void, ReviewReviewerError>` (user actors only)
    - `takeOver(params: ReviewActorParams): Result<void, ReviewTakeOverError>` (user actors only)
    - `pullFacts(): ReviewFact[]`
  - Fixture helper `expectOk(result)`: returns the value or throws the error, so setup steps fail at their cause.

- [ ] **Step 1: Extend the fixtures**

Replace `packages/api-workflows/__tests__/__helpers/fixtures.ts` with:

```ts
import type { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import type {
    Actor,
    ReviewPick,
    StepAssignmentResolution,
    TargetContext
} from "~/domain/review/types.js";
import type { Workflow, WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";

export const NOW = "2026-10-09T10:00:00.000Z";
export const REVIEW_TEAM_ID = "team-reviewers";
export const OTHER_TEAM_ID = "team-other";
export const ARTICLE_MODEL = "cms.article";

/** Returns the value of an ok result; throws the error otherwise, so setup fails at its cause. */
export const expectOk = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export interface ReviewStepFixtureParams {
    id: string;
    title: string;
    teams?: string[];
    allowManualPick?: boolean;
    rules?: unknown[];
}

export const createReviewStep = (params: ReviewStepFixtureParams): WorkflowStep => {
    return {
        id: params.id,
        title: params.title,
        color: "#3b82f6",
        type: "review",
        notifications: [],
        config: {
            teams: params.teams ?? [REVIEW_TEAM_ID],
            assignment: {
                strategy: "none",
                allowManualPick: params.allowManualPick ?? false,
                rules: params.rules ?? []
            }
        }
    };
};

export const createWorkflowValues = (overrides: Partial<WorkflowValues> = {}): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Article review",
        models: [ARTICLE_MODEL],
        steps: [
            createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ],
        ...overrides
    };
};

export const createWorkflow = (overrides: Partial<WorkflowValues> = {}): Workflow => {
    return {
        ...createWorkflowValues(overrides),
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: "admin", displayName: "Admin", type: "admin" },
        savedBy: { id: "admin", displayName: "Admin", type: "admin" }
    };
};

export const requester: Actor = {
    type: "user",
    id: "user-requester",
    displayName: "Rita Requester",
    identityType: "admin"
};

export const reviewer: Actor = {
    type: "user",
    id: "user-reviewer",
    displayName: "Rob Reviewer"
};

export const otherReviewer: Actor = {
    type: "user",
    id: "user-other-reviewer",
    displayName: "Olga Reviewer"
};

/** AI owners carry the requester's id (D58) and are named by the step title (D107). */
export const aiActor: Actor = {
    type: "ai",
    id: "user-requester",
    displayName: "AI check"
};

export const targetContext: TargetContext = {
    folder: { id: "folder-1", type: "cms:article" },
    modelId: "article",
    title: "Article 1",
    author: { id: "user-requester", displayName: "Rita Requester" }
};

export const poolResolution = (): StepAssignmentResolution => {
    return {
        owner: null,
        candidateTeamIds: [REVIEW_TEAM_ID],
        assignment: { source: "pool" }
    };
};

export interface RequestedReviewParams {
    id?: string;
    targetRevisionId?: string;
    picks?: ReviewPick[];
    workflow?: Workflow;
}

/** A review whose first step was reached into the pool. Facts are left in place. */
export const createRequestedReview = (params: RequestedReviewParams = {}): Review => {
    const targetRevisionId = params.targetRevisionId ?? "article-1#0001";
    const review = expectOk(
        Review.request({
            id: params.id ?? "review-1",
            workflow: params.workflow ?? createWorkflow(),
            model: ARTICLE_MODEL,
            targetId: targetRevisionId.split("#")[0],
            targetRevisionId,
            title: "Article 1",
            targetContext,
            picks: params.picks ?? [],
            requester,
            now: NOW
        })
    );
    expectOk(review.reach({ resolution: poolResolution(), actor: requester, now: NOW }));
    return review;
};

/** A review whose first step ("legal") was started by `reviewer`. Facts are cleared. */
export const createStartedReview = (params: RequestedReviewParams = {}): Review => {
    const review = createRequestedReview(params);
    expectOk(
        review.start({
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: NOW
        })
    );
    review.pullFacts();
    return review;
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/api-workflows/__tests__/domain/Review.request.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review, type ReviewRequestParams } from "~/domain/review/Review.js";
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

/** A non-user actor that is not the requester, so only the actor-type rule can reject it. */
const automationActor: Actor = {
    type: "automation",
    id: "user-reviewer",
    displayName: "Automation"
};

const requestParams = (overrides: Partial<ReviewRequestParams> = {}): ReviewRequestParams => {
    return {
        id: "review-1",
        workflow: createWorkflow(),
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        targetContext,
        picks: [],
        requester,
        now: NOW,
        ...overrides
    };
};

const requestReview = (overrides: Partial<ReviewRequestParams> = {}): Review => {
    return expectOk(Review.request(requestParams(overrides)));
};

const onLegal = (actor: Actor, actorTeamIds: string[] = [REVIEW_TEAM_ID]) => {
    return { stepId: "legal", actor, actorTeamIds, now: LATER };
};

describe("Review.request", () => {
    it("snapshots the workflow with every step pending", () => {
        const workflow = createWorkflow();
        const review = requestReview({ workflow });

        const data = review.toData();

        expect(data).toMatchObject({
            id: "review-1",
            workflowId: workflow.id,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            isActive: true,
            state: "inProgress",
            targetContext,
            workflow: { name: workflow.name, models: workflow.models },
            createdBy: requester,
            createdOn: NOW,
            lastChangedOn: NOW
        });
        expect(data.steps.map(step => step.state)).toEqual(["pending", "pending"]);
        expect(data.steps[0].config).toEqual(workflow.steps[0].config);
        expect(review.getStepToReach()?.id).toBe("legal");
        expect(review.pullFacts()).toEqual([
            { type: "requested", occurredOn: NOW, actor: requester }
        ]);
    });

    it("stores picks on the matching steps", () => {
        const review = requestReview({ picks: [{ stepId: "legal", userId: otherReviewer.id }] });

        expect(review.toData().steps.map(step => step.pickedUserId)).toEqual([
            otherReviewer.id,
            null
        ]);
    });

    it("rejects picks for unknown steps or steps without manual picks", () => {
        const unknownStep = Review.request(
            requestParams({ picks: [{ stepId: "missing", userId: reviewer.id }] })
        );
        expect(unknownStep.isFail()).toBe(true);
        expect(unknownStep.error.code).toBe("Workflows/Review/Validation");
        expect(unknownStep.error.message).toBe(
            'Step "missing" does not exist in workflow "Article review".'
        );

        const noPicks = Review.request(
            requestParams({ picks: [{ stepId: "editorial", userId: reviewer.id }] })
        );
        expect(noPicks.isFail()).toBe(true);
        expect(noPicks.error.message).toBe(
            'Step "Editorial review" does not allow picking a reviewer.'
        );
    });

    it("rejects two picks for the same step", () => {
        const result = Review.request(
            requestParams({
                picks: [
                    { stepId: "legal", userId: reviewer.id },
                    { stepId: "legal", userId: otherReviewer.id }
                ]
            })
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe('Step "Legal review" has more than one pick.');
    });

    it("rejects a model the workflow is not bound to", () => {
        const result = Review.request(requestParams({ model: "cms.other" }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe(
            'The workflow "Article review" is not bound to the model "cms.other".'
        );
    });

    it("rejects a workflow without steps", () => {
        const result = Review.request(requestParams({ workflow: createWorkflow({ steps: [] }) }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe('The workflow "Article review" has no steps.');
    });
});

describe("Review.reach", () => {
    it("puts the step in the pool when nobody owns it", () => {
        const review = requestReview();
        review.pullFacts();

        const result = review.reach({ resolution: poolResolution(), actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignmentSource: "pool",
            assignment: { source: "pool" },
            reachedOn: NOW,
            startedOn: null
        });
        expect(review.getStepToReach()).toBeNull();
        expect(review.pullFacts()).toEqual([
            {
                type: "stepReached",
                occurredOn: NOW,
                actor: requester,
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: { source: "pool" }
            }
        ]);
    });

    it("starts the step when an owner resolves", () => {
        const review = requestReview();

        expectOk(
            review.reach({
                resolution: {
                    owner: reviewer,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "picked" }
                },
                actor: requester,
                now: NOW
            })
        );

        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: reviewer,
            assignmentSource: "picked",
            reachedOn: NOW,
            startedOn: NOW
        });
    });

    it("falls back to the pool when the resolved owner is the requester", () => {
        const review = requestReview();
        review.pullFacts();

        expectOk(
            review.reach({
                resolution: {
                    owner: requester,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "picked" }
                },
                actor: requester,
                now: NOW
            })
        );

        const expectedAssignment = {
            source: "pool",
            reason: "The resolved owner is the requester, who cannot review their own content."
        };
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignmentSource: "pool",
            assignment: expectedAssignment,
            startedOn: null
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepReached",
                occurredOn: NOW,
                actor: requester,
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: expectedAssignment
            }
        ]);
    });

    it("fails when the current step is not pending", () => {
        const review = createRequestedReview();

        const result = review.reach({ resolution: poolResolution(), actor: requester, now: NOW });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            transition: "reach",
            reviewState: "inProgress",
            stepId: "legal",
            stepState: "awaiting"
        });
    });
});

describe("Review.start", () => {
    it("lets a candidate start an awaiting step", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.start(onLegal(reviewer));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: reviewer,
            startedOn: LATER,
            assignmentSource: "poolStart",
            assignment: { source: "poolStart" }
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepStarted",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "awaiting", toState: "inReview" }
            }
        ]);
    });

    it("does not let the requester start their own review", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.start(onLegal(requester));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(review.toData().steps[0].state).toBe("awaiting");
        expect(review.pullFacts()).toEqual([]);
    });

    it("does not let a user outside the candidate teams start", () => {
        const review = createRequestedReview();

        const result = review.start(onLegal(reviewer, [OTHER_TEAM_ID]));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
        expect(result.error.data).toEqual({ reviewId: "review-1", stepId: "legal" });
    });

    it("does not let a non-user actor start", () => {
        const review = createRequestedReview();

        const result = review.start(onLegal(automationActor));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/ActorNotUser");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "legal",
            actorType: "automation"
        });
    });

    it("fails when the step is not the current step", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.start({ ...onLegal(reviewer), stepId: "editorial" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "editorial",
            currentStepId: "legal"
        });
        expect(review.pullFacts()).toEqual([]);
    });

    it("cannot start a step that is already in review", () => {
        const review = createStartedReview();

        const result = review.start(onLegal(otherReviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });
});

describe("Review.takeOver", () => {
    it("moves a human step to another candidate", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(otherReviewer));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: otherReviewer,
            assignmentSource: "takeOver",
            assignment: { source: "takeOver", by: otherReviewer }
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepTakenOver",
                occurredOn: LATER,
                actor: otherReviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
                previousOwner: reviewer
            }
        ]);
    });

    it("does not let the current owner take over", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(reviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("does not let the requester take over", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(requester));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/RequesterCannotReview");
    });

    it("does not let a user outside the candidate teams take over", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(otherReviewer, [OTHER_TEAM_ID]));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
        expect(review.toData().steps[0].owner).toEqual(reviewer);
    });

    it("does not let a non-user actor take over", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(automationActor));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/ActorNotUser");
    });

    it("fails when the step is not the current step", () => {
        const review = createStartedReview();

        const result = review.takeOver({ ...onLegal(otherReviewer), stepId: "editorial" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(review.toData().steps[0].owner).toEqual(reviewer);
    });

    it("does not take over an AI step", () => {
        const review = requestReview();
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

        const result = review.takeOver(onLegal(reviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotTakeable");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "legal",
            ownerType: "ai"
        });
    });

    it("cannot take over an awaiting step", () => {
        const review = createRequestedReview();

        const result = review.takeOver(onLegal(reviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/review/Review.js`.

- [ ] **Step 4: Add the review types**

Create `packages/api-workflows/src/domain/review/types.ts`:

```ts
import type { WorkflowStep } from "~/domain/workflow/types.js";

export type ReviewState = "inProgress" | "approved" | "rejected" | "cancelled";

export type StepState = "pending" | "awaiting" | "inReview" | "approved" | "rejected" | "failed";

export type ActorType = "user" | "ai" | "automation";

/** Who acted or holds a step (D3, D30). For AI and automation, `id` is the requester's id (D58). */
export interface Actor {
    type: ActorType;
    id: string;
    displayName: string;
    identityType?: string;
}

/** "Why this owner" (D127). Sources: rule id, "strategy", "picked", "pool", "poolStart", "takeOver", "reassign". */
export interface ReviewStepAssignment {
    source: string;
    ruleId?: string;
    reason?: string;
    by?: Actor;
}

export interface ReviewStep extends WorkflowStep {
    state: StepState;
    owner: Actor | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    assignmentSource: string | null;
    assignment: ReviewStepAssignment | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
}

export interface ReviewWorkflowSnapshot {
    name: string;
    models: string[];
}

export interface TargetContextFolder {
    id: string;
    type: string;
}

export interface TargetContextAuthor {
    id: string;
    displayName: string;
}

/** Produced by the target adapter (`ReviewTargetLoader`, spec 9.3). */
export interface TargetContext {
    folder: TargetContextFolder | null;
    modelId: string;
    title: string;
    author: TargetContextAuthor;
}

export interface ReviewData {
    id: string;
    workflowId: string;
    /** Namespace id, e.g. "cms.article" (D41). */
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    /** Current review of the revision; false only after cancel (D23). */
    isActive: boolean;
    state: ReviewState;
    currentStepId: string | null;
    currentStepState: StepState | null;
    /** Only for `user` owners (D74). */
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[];
    targetContext: TargetContext;
    workflow: ReviewWorkflowSnapshot;
    steps: ReviewStep[];
    /** The requester. */
    createdBy: Actor;
    createdOn: string;
    savedOn: string;
    /** Changes on every review event; list sort key (D119). */
    lastChangedOn: string;
}

export interface ReviewPick {
    stepId: string;
    userId: string;
}

/** Result of assignment resolution on step reached (spec 5.2, 6). */
export interface StepAssignmentResolution {
    owner: Actor | null;
    candidateTeamIds: string[];
    assignment: ReviewStepAssignment;
}

/** The value of `system.workflow` on the target revision (spec 4.5). */
export interface ReviewSystemWorkflow {
    workflowId: string;
    reviewState: ReviewState;
    stepId: string;
    stepName: string;
    stepState: StepState;
}
```

- [ ] **Step 5: Add the review facts**

Create `packages/api-workflows/src/domain/review/facts.ts`:

```ts
import type { Actor, ReviewStepAssignment, StepState } from "./types.js";

/**
 * Domain facts recorded by the `Review` aggregate. `ReviewSaver` publishes one event per fact
 * after the review is persisted. Each fact carries what a later audit app needs (spec 9.5).
 */
export interface ReviewStepChange {
    stepId: string;
    fromState: StepState;
    toState: StepState;
}

export interface ReviewRequestedFact {
    type: "requested";
    occurredOn: string;
    actor: Actor;
}

export interface ReviewStepReachedFact {
    type: "stepReached";
    occurredOn: string;
    /** Who caused the step to be reached: the requester or the approver of the previous step. */
    actor: Actor;
    change: ReviewStepChange;
    assignment: ReviewStepAssignment;
}

export interface ReviewStepStartedFact {
    type: "stepStarted";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
}

export interface ReviewStepTakenOverFact {
    type: "stepTakenOver";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    previousOwner: Actor;
}

export interface ReviewStepApprovedFact {
    type: "stepApproved";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    comment: string | null;
}

export interface ReviewStepRejectedFact {
    type: "stepRejected";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    comment: string | null;
}

export interface ReviewCancelledFact {
    type: "cancelled";
    occurredOn: string;
    actor: Actor;
    /** The step that was current when the review was cancelled. */
    stepId: string | null;
    stepState: StepState | null;
}

export interface ReviewApprovedFact {
    type: "approved";
    occurredOn: string;
    actor: Actor;
}

export type ReviewFact =
    | ReviewRequestedFact
    | ReviewStepReachedFact
    | ReviewStepStartedFact
    | ReviewStepTakenOverFact
    | ReviewStepApprovedFact
    | ReviewStepRejectedFact
    | ReviewCancelledFact
    | ReviewApprovedFact;
```

- [ ] **Step 6: Add the review errors**

Create `packages/api-workflows/src/domain/review/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";
import type { ActorType, ReviewData, ReviewState, StepState } from "./types.js";

export type ReviewTransitionName = "reach" | "start" | "takeOver" | "approve" | "reject" | "cancel";

export interface ReviewNotFoundErrorData {
    id: string;
}

export class ReviewNotFoundError extends BaseError<ReviewNotFoundErrorData> {
    override readonly code = "Workflows/Review/NotFound" as const;

    constructor(data: ReviewNotFoundErrorData) {
        super({ message: `Review "${data.id}" was not found.`, data });
    }
}

export interface ReviewPersistenceErrorCause {
    code?: string;
    message: string;
}

export interface ReviewPersistenceErrorData {
    cause: ReviewPersistenceErrorCause;
}

export class ReviewPersistenceError extends BaseError<ReviewPersistenceErrorData> {
    override readonly code = "Workflows/Review/Persistence" as const;

    constructor(error: Error & { code?: string }) {
        super({
            message: error.message,
            data: { cause: { code: error.code, message: error.message } }
        });
    }
}

export class ReviewValidationError extends BaseError {
    override readonly code = "Workflows/Review/Validation" as const;

    constructor(message: string) {
        super({ message });
    }
}

export interface ReviewInvalidStateErrorData {
    reviewId: string;
    transition: ReviewTransitionName;
    reviewState: ReviewState;
    stepId: string | null;
    stepState: StepState | null;
}

export class ReviewInvalidStateError extends BaseError<ReviewInvalidStateErrorData> {
    override readonly code = "Workflows/Review/InvalidState" as const;

    constructor(data: ReviewInvalidStateErrorData) {
        super({
            message: `Cannot ${data.transition} review "${data.reviewId}": the review is "${data.reviewState}" and the current step is "${data.stepState ?? "none"}".`,
            data
        });
    }
}

export interface ReviewStepNotCurrentErrorData {
    reviewId: string;
    /** The step the caller acted on. */
    stepId: string;
    currentStepId: string | null;
}

/** The caller acted on a step that is no longer (or not yet) the current step (R17). */
export class ReviewStepNotCurrentError extends BaseError<ReviewStepNotCurrentErrorData> {
    override readonly code = "Workflows/Review/StepNotCurrent" as const;

    constructor(data: ReviewStepNotCurrentErrorData) {
        super({
            message: `Step "${data.stepId}" is not the current step of review "${data.reviewId}". Reload the review.`,
            data
        });
    }
}

export interface ReviewStepErrorData {
    reviewId: string;
    stepId: string;
}

export interface ReviewActorNotUserErrorData extends ReviewStepErrorData {
    actorType: ActorType;
}

/** Start and take over make a user the owner (spec 5.1); AI and automation never do them. */
export class ReviewActorNotUserError extends BaseError<ReviewActorNotUserErrorData> {
    override readonly code = "Workflows/Review/ActorNotUser" as const;

    constructor(data: ReviewActorNotUserErrorData) {
        super({ message: "Only users can start or take over a step.", data });
    }
}

export class ReviewRequesterCannotReviewError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/RequesterCannotReview" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "The requester cannot review their own content.", data });
    }
}

export class ReviewNotCandidateError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/NotCandidate" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "Only members of the step's teams can review this step.", data });
    }
}

export class ReviewAlreadyOwnerError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/AlreadyOwner" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "You already hold this step.", data });
    }
}

export class ReviewNotOwnerError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/NotOwner" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "Only the step owner can approve or reject it.", data });
    }
}

export interface ReviewStepNotTakeableErrorData extends ReviewStepErrorData {
    ownerType: ActorType | null;
}

export class ReviewStepNotTakeableError extends BaseError<ReviewStepNotTakeableErrorData> {
    override readonly code = "Workflows/Review/StepNotTakeable" as const;

    constructor(data: ReviewStepNotTakeableErrorData) {
        super({ message: "AI and automation steps cannot be taken over.", data });
    }
}

export interface ReviewAlreadyActiveErrorData {
    reviewId: string;
    targetRevisionId: string;
}

export class ReviewAlreadyActiveError extends BaseError<ReviewAlreadyActiveErrorData> {
    override readonly code = "Workflows/Review/AlreadyActive" as const;

    constructor(data: ReviewAlreadyActiveErrorData) {
        super({
            message: `Revision "${data.targetRevisionId}" already has an active review.`,
            data
        });
    }
}

export interface ReviewWorkflowNotFoundErrorData {
    model: string;
}

export class ReviewWorkflowNotFoundError extends BaseError<ReviewWorkflowNotFoundErrorData> {
    override readonly code = "Workflows/Review/WorkflowNotFound" as const;

    constructor(data: ReviewWorkflowNotFoundErrorData) {
        super({ message: `No workflow is bound to the model "${data.model}".`, data });
    }
}

export interface ReviewTargetNotFoundErrorData {
    model: string;
    targetRevisionId: string;
}

export class ReviewTargetNotFoundError extends BaseError<ReviewTargetNotFoundErrorData> {
    override readonly code = "Workflows/Review/TargetNotFound" as const;

    constructor(data: ReviewTargetNotFoundErrorData) {
        super({
            message: `Content "${data.targetRevisionId}" of the model "${data.model}" was not found.`,
            data
        });
    }
}

export interface ReviewTargetSyncErrorData {
    /** The review as saved; the save is not rolled back (R16). */
    review: ReviewData;
}

export interface ReviewTargetSyncErrorParams {
    review: ReviewData;
    /** The sync failure. */
    error: Error;
}

/**
 * The review was saved and its events were published, but writing `system.workflow` to the target
 * failed (R16). Returned by `ReviewSaver`; phase 2 adapters produce the underlying errors.
 */
export class ReviewTargetSyncError extends BaseError<ReviewTargetSyncErrorData> {
    override readonly code = "Workflows/Review/TargetSync" as const;

    constructor(params: ReviewTargetSyncErrorParams) {
        super({
            message: `The review was saved, but updating its content failed: ${params.error.message}`,
            data: { review: params.review }
        });
    }
}
```

- [ ] **Step 7: Add the aggregate**

Create `packages/api-workflows/src/domain/review/Review.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import type {
    Actor,
    ReviewData,
    ReviewPick,
    ReviewStep,
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
    ReviewRequesterCannotReviewError,
    ReviewStepNotCurrentError,
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

export interface ReviewActorParams {
    /** The step the caller acted on; must be the current step (R17). */
    stepId: string;
    actor: Actor;
    /** Teams of the actor, resolved by the caller (the aggregate never reads identity, D5). */
    actorTeamIds: string[];
    now: string;
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

/**
 * One run of a workflow on one target revision (spec 3, 4.2, 5.1). Transitions take an explicit
 * actor and `now`, never read identity, and record facts; `ReviewSaver` persists the review and
 * publishes one event per fact.
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
                    new ReviewValidationError(`Step "${step.title}" does not allow picking a reviewer.`)
                );
            }
            if (picks.has(step.id)) {
                return Result.fail(
                    new ReviewValidationError(`Step "${step.title}" has more than one pick.`)
                );
            }
            picks.set(step.id, pick.userId);
        }

        const steps = params.workflow.steps.map(
            (step): ReviewStep => ({
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
            })
        );

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
        review.facts.push({ type: "requested", occurredOn: params.now, actor: { ...params.requester } });
        return Result.ok(review);
    }

    public get id(): string {
        return this.data.id;
    }

    public toData(): ReviewData {
        return structuredClone(this.data);
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
            change: { stepId: step.id, fromState: "pending", toState: step.state },
            assignment: structuredClone(resolution.assignment)
        });
        return Result.ok();
    }

    public start(params: ReviewActorParams): Result<void, ReviewReviewerError> {
        const current = this.getRequestedStepIn("start", "awaiting", params.stepId);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const reviewer = this.checkReviewer(step, params);
        if (reviewer.isFail()) {
            return Result.fail(reviewer.error);
        }

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

    public takeOver(params: ReviewActorParams): Result<void, ReviewTakeOverError> {
        const current = this.getRequestedStepIn("takeOver", "inReview", params.stepId);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const previousOwner = step.owner;
        if (!previousOwner || previousOwner.type !== "user") {
            // AI and automation steps cannot be taken over (D9).
            return Result.fail(
                new ReviewStepNotTakeableError({
                    reviewId: this.data.id,
                    stepId: step.id,
                    ownerType: previousOwner?.type ?? null
                })
            );
        }
        const reviewer = this.checkReviewer(step, params);
        if (reviewer.isFail()) {
            return Result.fail(reviewer.error);
        }
        if (previousOwner.id === params.actor.id) {
            return Result.fail(
                new ReviewAlreadyOwnerError({ reviewId: this.data.id, stepId: step.id })
            );
        }

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

    /** Returns and clears the facts recorded since the last call. */
    public pullFacts(): ReviewFact[] {
        return this.facts.splice(0, this.facts.length);
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
    private withoutRequesterOwner(
        resolution: StepAssignmentResolution
    ): StepAssignmentResolution {
        const owner = resolution.owner;
        if (!owner || owner.type !== "user" || owner.id !== this.data.createdBy.id) {
            return resolution;
        }
        return {
            owner: null,
            candidateTeamIds: [...resolution.candidateTeamIds],
            assignment: { source: "pool", reason: REQUESTER_OWNER_REASON }
        };
    }

    /** Human actions: a user, not the requester, member of the step's candidate teams (spec 5.1). */
    private checkReviewer(
        step: ReviewStep,
        params: ReviewActorParams
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
        if (params.actor.id === this.data.createdBy.id) {
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

- [ ] **Step 8: Run the test**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50`
Expected: PASS (24 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add review aggregate with request, reach, start and take over

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
