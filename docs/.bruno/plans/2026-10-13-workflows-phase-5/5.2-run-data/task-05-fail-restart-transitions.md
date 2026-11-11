### Task 5: `reachRun`, `fail`, `restart`, facts and events

Spec 5.1, 5.2, 9.5; D8, D34, D57, D58, D82, D107, D119; R140, R141, R153; A54. Failed steps arrive in the aggregate (nothing calls these transitions yet; Tasks 10-15 do):

- `Review.reachRun({ actor, owner, taskId, now })` reaches the next `pending` step of an automation (`getCurrentStepIn("reach", "pending")`, so a non-pending step or a finished review fails with `ReviewInvalidStateError`, transition `"reach"`): `pending` to `inReview`, `owner` = the given owner (the automation actor, R141), `startedOn` and `reachedOn` = `now`, `assignment` and `assignmentSource` `null`, `candidateTeamIds` `[]`, `taskId` stored. It records the existing `stepReached` fact with `actor` = the caller, `owner`, `assignment: null`, `taskId` and `records: []` (no assignment-log record, R117 is for human assignment). `ReviewStepReachedFact.assignment` becomes `ReviewStepAssignment | null` and the fact gains `taskId: string | null`; `Review.reach` records `taskId: null`. The step's owner is not a user, so `currentOwnerId` is `null` after `prepareForSave` (A54).
- `Review.fail({ stepId, reason, now })` fails the current step when it is `pending` or `inReview`: `state: "failed"`, `comment` = `reason`, `finishedOn` = `now`, the owner kept. The fact `stepFailed { actor, change, reason }` has the step's owner as `actor`, else the requester (`createdBy`). An already `failed` current step is a no-op `Result.ok` with no fact (idempotent, R140): a late hook or stuck detection cannot fail a step twice. Other step states (`awaiting`, `approved`, `rejected`) or a review that is not `inProgress` fail with `ReviewInvalidStateError`, transition `"fail"`; a `stepId` other than the current step fails with `ReviewStepNotCurrentError`. The review stays `inProgress` with `currentStepState: "failed"` (the failed list of phase 3 reads that, D112).
- `Review.checkRestart({ stepId })` / `Review.restart({ stepId, actor, now })`: only a `failed` current step (`getRequestedStepIn("restart", "failed", stepId)`); a `rejected` step (the review is `rejected`) and any other state fail with `ReviewInvalidStateError`, transition `"restart"`; another step fails with `ReviewStepNotCurrentError`. `restart` appends the failed attempt to `runs` (`taskId` = the step's `taskId`; `startedOn` = the step's `startedOn`, else its `reachedOn`, else its `finishedOn`; `finishedOn`; `outcome: "failed"`; `reason` = the `comment`), clears `comment` and `taskId`, sets `pending`, keeps the owner, and also clears `startedOn`, `reachedOn` and `finishedOn` (a `pending` step has none, and a re-reach that fails before its task starts must not inherit the old attempt's times; `reachRun` sets them again). The fact `stepRestarted { actor, change, previousTaskId }` has the restarter as `actor`. The caller re-reaches the step afterwards (Task 15).
- `ReviewTransitionName` gains `"fail" | "restart"`. New types `ReviewFailError` and `ReviewRestartError` (both `ReviewInvalidStateError | ReviewStepNotCurrentError`).
- New facts `ReviewStepFailedFact`, `ReviewStepRestartedFact` in the `ReviewFact` union; new events `ReviewStepFailedEvent` (`Workflows/Review/StepFailed`) and `ReviewStepRestartedEvent` (`Workflows/Review/StepRestarted`) with their handler abstractions, in the `ReviewEvent` union; `ReviewSaver.createEvent` maps both; the exhaustive `toAssignmentRecordValues` switch returns `[]` for both (they write no assignment record).
- Pure `getAutomationActor(requester)` (`domain/automation/getAutomationActor.ts`, R141): `{ type: "automation", id: requester.id, displayName: requester.displayName }`, `identityType` omitted. Consumed by Tasks 10 and 12.

Tests use a small test-only helper (`__tests__/__helpers/stepRunReviews.ts`) that builds a workflow whose first step is an `automation` step (type `"automation"`, config `{ automationId: "test-automation", settings: {} }`; `Review.request` does not validate step types) followed by the review step `editorial`, and reviews in the states the transitions need.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/errors.ts`
- Modify: `packages/api-workflows/src/domain/review/facts.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/domain/assignment/toAssignmentRecordValues.ts`
- Modify: `packages/api-workflows/src/features/review/events.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`
- Create: `packages/api-workflows/src/domain/automation/getAutomationActor.ts`
- Create: `packages/api-workflows/__tests__/__helpers/stepRunReviews.ts`
- Create: `packages/api-workflows/__tests__/domain/Review.stepRun.test.ts`
- Create: `packages/api-workflows/__tests__/domain/getAutomationActor.test.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewFailRestartEvents.test.ts`
- Modify: `packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts`
- Modify: `packages/api-workflows/__tests__/domain/Review.request.test.ts`
- Modify: `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`

**Interfaces:**
- Consumes:
  - Task 4: `ReviewStep.taskId: string | null`, `ReviewStep.runs: ReviewStepRun[]`, `ReviewStepRun`, `StepRunOutcome` (`~/domain/review/types.js`).
  - Existing: `Review` (`getCurrentStepIn`, `getRequestedStepIn`, `findCurrentStep`, `toCheck`, `isRequestedBy`, `prepareForSave`, `pullFacts`), `ReviewStepParams`, `ReviewInvalidStateError`, `ReviewStepNotCurrentError`, `ReviewStepChange`, `ReviewFact`, `ReviewEventPayload`, `ReviewSaver`, `toAssignmentRecordValues`; test helpers `createReviewStep`, `createWorkflow`, `createRequestedReview`, `expectOk`, `NOW`, `ARTICLE_MODEL`, `requester`, `targetContext` (`~tests/__helpers/fixtures.js`), `createContextHandler`, `RecordingEventPublisher`, `recordedEvents`, `workflowEventTypes`, `RecordingReviewTargetSync`, `recordedSyncs`.
- Produces:
  - `Review.reachRun(params: ReviewReachRunParams): Result<void, ReviewInvalidStateError>`; `ReviewReachRunParams { actor: Actor; owner: Actor; taskId: string | null; now: string }`.
  - `Review.fail(params: ReviewFailParams): Result<void, ReviewFailError>`; `ReviewFailParams extends ReviewStepParams { reason: string; now: string }`; `ReviewFailError = ReviewInvalidStateError | ReviewStepNotCurrentError`.
  - `Review.checkRestart(params: ReviewStepParams): Result<void, ReviewRestartError>`; `Review.restart(params: ReviewRestartParams): Result<void, ReviewRestartError>`; `ReviewRestartParams extends ReviewStepParams { actor: Actor; now: string }`; `ReviewRestartError = ReviewInvalidStateError | ReviewStepNotCurrentError` (all `~/domain/review/Review.js`).
  - `ReviewTransitionName` with `"fail" | "restart"` (`~/domain/review/errors.js`).
  - `ReviewStepReachedFact.assignment: ReviewStepAssignment | null`, `.taskId: string | null`; `ReviewStepFailedFact { type: "stepFailed"; occurredOn: string; actor: Actor; change: ReviewStepChange; reason: string }`; `ReviewStepRestartedFact { type: "stepRestarted"; occurredOn: string; actor: Actor; change: ReviewStepChange; previousTaskId: string | null }`, both in `ReviewFact` (`~/domain/review/facts.js`).
  - `ReviewStepFailedEvent` (`eventType "Workflows/Review/StepFailed"`), `ReviewStepFailedEventHandler`, `ReviewStepRestartedEvent` (`eventType "Workflows/Review/StepRestarted"`), `ReviewStepRestartedEventHandler` (`~/features/review/events.js`), both in the `ReviewEvent` union.
  - `getAutomationActor(requester: Actor): Actor` (`~/domain/automation/getAutomationActor.js`).
  - Test helpers `createAutomationWorkflow`, `createPendingAutomationReview`, `createRunningAutomationReview`, `createFailedAutomationReview`, `automationActor`, `AUTOMATION_STEP_ID` (`~tests/__helpers/stepRunReviews.js`), reused by Task 6.
  - Consumed by Tasks 6, 9, 10, 11, 12, 14, 15.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/stepRunReviews.ts`:

```ts
import { Review } from "~/domain/review/Review.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import type { Workflow } from "~/domain/workflow/types.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    targetContext
} from "./fixtures.js";

export const AUTOMATION_STEP_ID = "automation";

/** The owner of an automation step: the requester's id, type `automation` (R141). */
export const automationActor = getAutomationActor(requester);

/** An automation step ("automation") followed by the review step "editorial". */
export const createAutomationWorkflow = (): Workflow => {
    return createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: AUTOMATION_STEP_ID, title: "Check links" }),
                type: "automation",
                config: { automationId: "test-automation", settings: {} }
            },
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ]
    });
};

/** Requested, nothing reached: the automation step is `pending`. The `requested` fact stays. */
export const createPendingAutomationReview = (): Review => {
    return expectOk(
        Review.request({
            id: "review-1",
            workflow: createAutomationWorkflow(),
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
};

/** The automation step reached with `taskId` and `inReview`. Facts are cleared. */
export const createRunningAutomationReview = (taskId: string | null = "task-1"): Review => {
    const review = createPendingAutomationReview();
    expectOk(review.reachRun({ actor: requester, owner: automationActor, taskId, now: NOW }));
    review.pullFacts();
    return review;
};

/** The running automation step failed at `now`. Facts are cleared. */
export const createFailedAutomationReview = (
    reason = "The automation failed: boom.",
    now = "2026-10-09T11:00:00.000Z"
): Review => {
    const review = createRunningAutomationReview();
    expectOk(review.fail({ stepId: AUTOMATION_STEP_ID, reason, now }));
    review.pullFacts();
    return review;
};
```

Create `packages/api-workflows/__tests__/domain/getAutomationActor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { requester } from "~tests/__helpers/fixtures.js";

describe("getAutomationActor (R141)", () => {
    it("carries the requester's id and name with the automation type", () => {
        expect(getAutomationActor(requester)).toEqual({
            type: "automation",
            id: requester.id,
            displayName: requester.displayName
        });
    });

    it("omits the identity type, even when the requester has one", () => {
        expect(requester.identityType).toBe("admin");
        expect(getAutomationActor(requester)).not.toHaveProperty("identityType");
    });

    it("does not change the requester", () => {
        const copy = structuredClone(requester);

        getAutomationActor(requester);

        expect(requester).toEqual(copy);
    });
});
```

Create `packages/api-workflows/__tests__/domain/Review.stepRun.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import {
    createRequestedReview,
    expectOk,
    NOW,
    otherReviewer,
    requester,
    reviewer
} from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
    createFailedAutomationReview,
    createPendingAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const LATER = "2026-10-09T11:00:00.000Z";
const EVEN_LATER = "2026-10-09T12:00:00.000Z";
const REASON = "The automation failed: boom.";

describe("Review.reachRun (R140)", () => {
    it("starts the pending step as the automation, with the task id and no assignment", () => {
        const review = createPendingAutomationReview();
        review.pullFacts();

        const result = review.reachRun({
            actor: requester,
            owner: automationActor,
            taskId: "task-1",
            now: LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: automationActor,
            candidateTeamIds: [],
            assignmentSource: null,
            assignment: null,
            reachedOn: LATER,
            startedOn: LATER,
            finishedOn: null,
            taskId: "task-1",
            runs: []
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepReached",
                occurredOn: LATER,
                actor: requester,
                owner: automationActor,
                change: { stepId: AUTOMATION_STEP_ID, fromState: "pending", toState: "inReview" },
                assignment: null,
                taskId: "task-1",
                records: []
            }
        ]);
    });

    it("leaves the review without a user owner, so it is in nobody's list (A54)", () => {
        const review = createPendingAutomationReview();
        expectOk(
            review.reachRun({
                actor: requester,
                owner: automationActor,
                taskId: "task-1",
                now: LATER
            })
        );

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            state: "inProgress",
            currentStepId: AUTOMATION_STEP_ID,
            currentStepState: "inReview",
            currentStepType: "automation",
            currentOwnerId: null,
            currentCandidateTeamIds: []
        });
    });

    it("accepts a null task id", () => {
        const review = createPendingAutomationReview();

        const result = review.reachRun({
            actor: requester,
            owner: automationActor,
            taskId: null,
            now: LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0].taskId).toBeNull();
    });

    it("refuses a step that is not pending and changes nothing", () => {
        const review = createRunningAutomationReview();

        const result = review.reachRun({
            actor: requester,
            owner: automationActor,
            taskId: "task-2",
            now: LATER
        });

        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toMatchObject({
            transition: "reach",
            reviewState: "inProgress",
            stepId: AUTOMATION_STEP_ID,
            stepState: "inReview"
        });
        expect(review.toData().steps[0].taskId).toBe("task-1");
        expect(review.pullFacts()).toEqual([]);
    });

    it("refuses a cancelled review", () => {
        const review = createPendingAutomationReview();
        expectOk(review.cancel({ actor: requester, now: NOW }));
        review.pullFacts();

        const result = review.reachRun({
            actor: requester,
            owner: automationActor,
            taskId: "task-1",
            now: LATER
        });

        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(review.pullFacts()).toEqual([]);
    });

    it("records no task id on a human reach", () => {
        const review = createRequestedReview();

        expect(review.toData().steps[0].taskId).toBeNull();
        const [, reached] = review.pullFacts();
        expect(reached).toMatchObject({ type: "stepReached", taskId: null });
    });
});

describe("Review.fail (R140, D8)", () => {
    it("fails a step in review with the reason and keeps its owner", () => {
        const review = createRunningAutomationReview();

        const result = review.fail({ stepId: AUTOMATION_STEP_ID, reason: REASON, now: LATER });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: REASON,
            finishedOn: LATER,
            owner: automationActor,
            taskId: "task-1"
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepFailed",
                occurredOn: LATER,
                actor: automationActor,
                change: { stepId: AUTOMATION_STEP_ID, fromState: "inReview", toState: "failed" },
                reason: REASON
            }
        ]);
    });

    it("fails a pending step with the requester as the actor", () => {
        const review = createPendingAutomationReview();
        review.pullFacts();

        const result = review.fail({
            stepId: AUTOMATION_STEP_ID,
            reason: 'The automation "test-automation" is not available.',
            now: LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: 'The automation "test-automation" is not available.',
            owner: null,
            startedOn: null,
            reachedOn: null,
            finishedOn: LATER,
            taskId: null
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepFailed",
                occurredOn: LATER,
                actor: requester,
                change: { stepId: AUTOMATION_STEP_ID, fromState: "pending", toState: "failed" },
                reason: 'The automation "test-automation" is not available.'
            }
        ]);
    });

    it("keeps the review in progress with the failed step current (D112)", () => {
        const review = createFailedAutomationReview();

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            state: "inProgress",
            isActive: true,
            currentStepId: AUTOMATION_STEP_ID,
            currentStepState: "failed",
            currentStepType: "automation",
            currentOwnerId: null
        });
        expect(review.actionableStepId).toBe(AUTOMATION_STEP_ID);
        expect(review.getSystemWorkflow()).toMatchObject({
            reviewState: "inProgress",
            stepId: AUTOMATION_STEP_ID,
            stepState: "failed"
        });
    });

    it("is a no-op on a step that already failed: no fact, nothing overwritten", () => {
        const review = createFailedAutomationReview(REASON, LATER);

        const result = review.fail({
            stepId: AUTOMATION_STEP_ID,
            reason: "The automation was aborted.",
            now: EVEN_LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.pullFacts()).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: REASON,
            finishedOn: LATER
        });
    });

    it("refuses an awaiting step", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.fail({ stepId: "legal", reason: REASON, now: LATER });

        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toMatchObject({
            transition: "fail",
            stepId: "legal",
            stepState: "awaiting"
        });
        expect(review.pullFacts()).toEqual([]);
    });

    it("refuses a step that is not the current step", () => {
        const review = createRunningAutomationReview();

        const result = review.fail({ stepId: "editorial", reason: REASON, now: LATER });

        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "editorial",
            currentStepId: AUTOMATION_STEP_ID
        });
        expect(review.toData().steps[0].state).toBe("inReview");
    });

    it("refuses a cancelled review", () => {
        const review = createRunningAutomationReview();
        expectOk(review.cancel({ actor: requester, now: LATER }));
        review.pullFacts();

        const result = review.fail({ stepId: AUTOMATION_STEP_ID, reason: REASON, now: EVEN_LATER });

        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toMatchObject({ transition: "fail", reviewState: "cancelled" });
        expect(review.pullFacts()).toEqual([]);
    });

    it("refuses a rejected review", () => {
        const review = createRunningAutomationReview();
        expectOk(
            review.reject({
                stepId: AUTOMATION_STEP_ID,
                actor: automationActor,
                actorTeamIds: [],
                comment: "Does not meet the policy.",
                now: LATER
            })
        );
        review.pullFacts();

        const result = review.fail({ stepId: AUTOMATION_STEP_ID, reason: REASON, now: EVEN_LATER });

        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toMatchObject({
            transition: "fail",
            reviewState: "rejected",
            stepState: "rejected"
        });
    });
});

describe("Review.restart (R140, R153, D82)", () => {
    it("appends the failed attempt to runs and makes the step pending again", () => {
        const review = createFailedAutomationReview(REASON, LATER);

        const result = review.restart({
            stepId: AUTOMATION_STEP_ID,
            actor: requester,
            now: EVEN_LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "pending",
            comment: null,
            taskId: null,
            owner: automationActor,
            startedOn: null,
            reachedOn: null,
            finishedOn: null,
            runs: [
                {
                    taskId: "task-1",
                    startedOn: NOW,
                    finishedOn: LATER,
                    outcome: "failed",
                    reason: REASON
                }
            ]
        });
        expect(review.getStepToReach()?.id).toBe(AUTOMATION_STEP_ID);
        expect(review.pullFacts()).toEqual([
            {
                type: "stepRestarted",
                occurredOn: EVEN_LATER,
                actor: requester,
                change: { stepId: AUTOMATION_STEP_ID, fromState: "failed", toState: "pending" },
                previousTaskId: "task-1"
            }
        ]);
    });

    it("uses reachedOn, then finishedOn, when the step has no startedOn", () => {
        const withReachedOn = createFailedAutomationReview(REASON, LATER).toData();
        withReachedOn.steps[0].startedOn = null;
        withReachedOn.steps[0].reachedOn = "2026-10-09T10:30:00.000Z";
        const fromReachedOn = Review.fromData(withReachedOn);
        const fromFinishedOn = createPendingAutomationReview();
        fromFinishedOn.pullFacts();
        expectOk(fromFinishedOn.fail({ stepId: AUTOMATION_STEP_ID, reason: REASON, now: LATER }));
        fromFinishedOn.pullFacts();

        expectOk(
            fromReachedOn.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER })
        );
        expectOk(
            fromFinishedOn.restart({
                stepId: AUTOMATION_STEP_ID,
                actor: requester,
                now: EVEN_LATER
            })
        );

        expect(fromReachedOn.toData().steps[0].runs).toEqual([
            {
                taskId: "task-1",
                startedOn: "2026-10-09T10:30:00.000Z",
                finishedOn: LATER,
                outcome: "failed",
                reason: REASON
            }
        ]);
        // Failed from pending: no task was ever started (R139).
        expect(fromFinishedOn.toData().steps[0].runs).toEqual([
            { taskId: null, startedOn: LATER, finishedOn: LATER, outcome: "failed", reason: REASON }
        ]);
    });

    it("lets the step run again and keeps every earlier attempt, oldest first", () => {
        const review = createFailedAutomationReview(REASON, LATER);
        expectOk(
            review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER })
        );
        expectOk(
            review.reachRun({
                actor: requester,
                owner: automationActor,
                taskId: "task-2",
                now: EVEN_LATER
            })
        );
        expectOk(
            review.fail({
                stepId: AUTOMATION_STEP_ID,
                reason: "The automation was aborted.",
                now: "2026-10-09T13:00:00.000Z"
            })
        );
        review.pullFacts();

        expectOk(
            review.restart({
                stepId: AUTOMATION_STEP_ID,
                actor: requester,
                now: "2026-10-09T14:00:00.000Z"
            })
        );

        const [step] = review.toData().steps;
        expect(step.runs.map(run => run.taskId)).toEqual(["task-1", "task-2"]);
        expect(step.runs.map(run => run.reason)).toEqual([REASON, "The automation was aborted."]);
        expect(step.runs[1]).toMatchObject({
            startedOn: EVEN_LATER,
            finishedOn: "2026-10-09T13:00:00.000Z",
            outcome: "failed"
        });
        expect(review.pullFacts()).toMatchObject([
            { type: "stepRestarted", previousTaskId: "task-2" }
        ]);
    });

    it("checks without changing anything", () => {
        const review = createFailedAutomationReview();
        const before = review.toData();

        const result = review.checkRestart({ stepId: AUTOMATION_STEP_ID });

        expect(result.isOk()).toBe(true);
        expect(review.toData()).toEqual(before);
        expect(review.pullFacts()).toEqual([]);
    });

    it("refuses a rejected step: reject is final (D10)", () => {
        const review = createRunningAutomationReview();
        expectOk(
            review.reject({
                stepId: AUTOMATION_STEP_ID,
                actor: automationActor,
                actorTeamIds: [],
                comment: "Does not meet the policy.",
                now: LATER
            })
        );
        review.pullFacts();
        const before = review.toData();

        const checked = review.checkRestart({ stepId: AUTOMATION_STEP_ID });
        const restarted = review.restart({
            stepId: AUTOMATION_STEP_ID,
            actor: requester,
            now: EVEN_LATER
        });

        expect(checked.error.code).toBe("Workflows/Review/InvalidState");
        expect(restarted.error.code).toBe("Workflows/Review/InvalidState");
        expect(restarted.error.data).toEqual({
            reviewId: "review-1",
            transition: "restart",
            reviewState: "rejected",
            stepId: AUTOMATION_STEP_ID,
            stepState: "rejected"
        });
        expect(review.toData()).toEqual(before);
        expect(review.pullFacts()).toEqual([]);
    });

    it("refuses steps that are in review, awaiting or pending", () => {
        const inReview = createRunningAutomationReview();
        const awaiting = createRequestedReview();
        awaiting.pullFacts();
        const pending = createPendingAutomationReview();
        pending.pullFacts();

        const results = [
            inReview.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: LATER }),
            awaiting.restart({ stepId: "legal", actor: requester, now: LATER }),
            pending.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: LATER })
        ];

        expect(results.map(result => result.error.code)).toEqual([
            "Workflows/Review/InvalidState",
            "Workflows/Review/InvalidState",
            "Workflows/Review/InvalidState"
        ]);
        expect(results.map(result => result.error.data.stepState)).toEqual([
            "inReview",
            "awaiting",
            "pending"
        ]);
        expect(inReview.toData().steps[0].runs).toEqual([]);
        expect(inReview.pullFacts()).toEqual([]);
    });

    it("refuses a step that is not the current step", () => {
        const review = createFailedAutomationReview();

        const result = review.restart({ stepId: "editorial", actor: requester, now: EVEN_LATER });

        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(review.toData().steps[0].state).toBe("failed");
    });

    it("refuses a cancelled review", () => {
        const review = createFailedAutomationReview();
        expectOk(review.cancel({ actor: requester, now: EVEN_LATER }));
        review.pullFacts();

        const result = review.restart({
            stepId: AUTOMATION_STEP_ID,
            actor: otherReviewer,
            now: EVEN_LATER
        });

        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toMatchObject({
            transition: "restart",
            reviewState: "cancelled"
        });
    });

    it("checks the transition for any actor, since who may restart is a permission rule (R153)", () => {
        const review = createFailedAutomationReview();

        expect(
            review
                .restart({ stepId: AUTOMATION_STEP_ID, actor: reviewer, now: EVEN_LATER })
                .isOk()
        ).toBe(true);
    });
});
```

Create `packages/api-workflows/__tests__/review/ReviewFailRestartEvents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, requester } from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    RecordingReviewTargetSync,
    recordedSyncs
} from "~tests/__helpers/RecordingReviewTargetSync.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import type {
    ReviewStepFailedEvent,
    ReviewStepReachedEvent,
    ReviewStepRestartedEvent
} from "~/features/review/events.js";

const LATER = "2026-10-09T11:00:00.000Z";
const EVEN_LATER = "2026-10-09T12:00:00.000Z";
const REASON = "The automation failed: boom.";

const createRecordingContext = async () => {
    recordedEvents.length = 0;
    recordedSyncs.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.register(RecordingReviewTargetSync);
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    return context;
};

describe("ReviewSaver with fail and restart", () => {
    it("persists a failed step and publishes StepFailed", async () => {
        const context = await createRecordingContext();
        const saver = context.container.resolve(ReviewSaver);
        const saved = expectOk(await saver.save(createRunningAutomationReview()));
        recordedEvents.length = 0;
        recordedSyncs.length = 0;
        const review = Review.fromData(saved);
        expectOk(review.fail({ stepId: AUTOMATION_STEP_ID, reason: REASON, now: LATER }));

        const result = await saver.save(review);

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "inProgress",
            currentStepId: AUTOMATION_STEP_ID,
            currentStepState: "failed",
            lastChangedOn: LATER
        });
        expect(result.value.steps[0]).toMatchObject({
            state: "failed",
            comment: REASON,
            finishedOn: LATER,
            taskId: "task-1"
        });
        const stored = await context.container.resolve(ReviewRepository).get(review.id);
        expect(stored.value).toEqual(result.value);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        const failed = recordedEvents[0] as ReviewStepFailedEvent;
        expect(failed.payload.review).toEqual(result.value);
        expect(failed.payload.fact).toEqual({
            type: "stepFailed",
            occurredOn: LATER,
            actor: automationActor,
            change: { stepId: AUTOMATION_STEP_ID, fromState: "inReview", toState: "failed" },
            reason: REASON
        });
        expect(recordedSyncs.map(sync => sync.systemWorkflow?.stepState)).toEqual(["failed"]);
    });

    it("persists the restart with its run history, then the re-reach", async () => {
        const context = await createRecordingContext();
        const saver = context.container.resolve(ReviewSaver);
        const running = expectOk(await saver.save(createRunningAutomationReview()));
        const failing = Review.fromData(running);
        expectOk(failing.fail({ stepId: AUTOMATION_STEP_ID, reason: REASON, now: LATER }));
        const failed = expectOk(await saver.save(failing));
        recordedEvents.length = 0;
        const review = Review.fromData(failed);
        expectOk(
            review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER })
        );
        expectOk(
            review.reachRun({
                actor: requester,
                owner: automationActor,
                taskId: "task-2",
                now: EVEN_LATER
            })
        );

        const result = await saver.save(review);

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({
            state: "inReview",
            taskId: "task-2",
            comment: null,
            owner: automationActor,
            runs: [
                {
                    taskId: "task-1",
                    startedOn: "2026-10-09T10:00:00.000Z",
                    finishedOn: LATER,
                    outcome: "failed",
                    reason: REASON
                }
            ]
        });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepRestarted",
            "Workflows/Review/StepReached"
        ]);
        const restarted = recordedEvents[0] as ReviewStepRestartedEvent;
        expect(restarted.payload.fact).toEqual({
            type: "stepRestarted",
            occurredOn: EVEN_LATER,
            actor: requester,
            change: { stepId: AUTOMATION_STEP_ID, fromState: "failed", toState: "pending" },
            previousTaskId: "task-1"
        });
        const reached = recordedEvents[1] as ReviewStepReachedEvent;
        expect(reached.payload.fact).toEqual({
            type: "stepReached",
            occurredOn: EVEN_LATER,
            actor: requester,
            owner: automationActor,
            change: { stepId: AUTOMATION_STEP_ID, fromState: "pending", toState: "inReview" },
            assignment: null,
            taskId: "task-2",
            records: []
        });
    });
});
```

In `packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts`:
- in the first test, the `stepReached` fact literal gains `taskId: null` after `assignment`:

```ts
            assignment: { source: "roundRobin" },
            taskId: null,
            records: [SKIP, OUTCOME]
```

- in `"returns nothing for facts without assignment decisions"`, add the two new facts to `facts` (before `{ type: "approved", ... }`), and one more test after it:

```ts
            {
                type: "stepFailed",
                occurredOn: NOW,
                actor: requester,
                change: { stepId: "legal", fromState: "inReview", toState: "failed" },
                reason: "The automation failed: boom."
            },
            {
                type: "stepRestarted",
                occurredOn: NOW,
                actor: requester,
                change: { stepId: "legal", fromState: "failed", toState: "pending" },
                previousTaskId: "task-1"
            },
```

```ts
    it("writes no record for an automation reach: it has no assignment decision", () => {
        const review = toSaveData(createRequestedReview());
        const fact: ReviewFact = {
            type: "stepReached",
            occurredOn: LATER,
            actor: requester,
            owner: { type: "automation", id: requester.id, displayName: requester.displayName },
            change: { stepId: "legal", fromState: "pending", toState: "inReview" },
            assignment: null,
            taskId: "task-1",
            records: []
        };

        expect(toAssignmentRecordValues(review, fact)).toEqual([]);
    });
```

In `packages/api-workflows/__tests__/domain/Review.request.test.ts`, the three `stepReached` expectations (in `"puts the step in the pool when nobody owns it"`, `"starts the step when an owner resolves"` and `"falls back to the pool when the resolved owner is the requester"`) gain `taskId: null` after their `assignment` line:

```ts
                assignment: { source: "pool" },
                taskId: null,
                records: [poolOutcomeRecord()]
```

```ts
            assignment: { source: "picked" },
            taskId: null,
            records: [EXCLUDED_SKIP, pickedOutcome(reviewer.id)]
```

```ts
                assignment: expectedAssignment,
                taskId: null,
                // The resolver's skips stay; its outcome becomes the pool (R117).
```

In `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`, the `reached.payload.fact` expectation in `"persists the review, syncs system.workflow, then publishes one event per fact"` becomes:

```ts
        expect(reached.payload.fact).toEqual({
            type: "stepReached",
            occurredOn: NOW,
            actor: requester,
            owner: null,
            change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
            assignment: { source: "pool" },
            taskId: null,
            records: [poolOutcomeRecord()]
        });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.stepRun.test.ts packages/api-workflows/__tests__/domain/getAutomationActor.test.ts packages/api-workflows/__tests__/review/ReviewFailRestartEvents.test.ts packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50`
Expected: FAIL. `Review.stepRun.test.ts` and `ReviewFailRestartEvents.test.ts` fail in the helper with `review.reachRun is not a function`; `getAutomationActor.test.ts` cannot resolve `~/domain/automation/getAutomationActor.js`; the changed `stepReached` expectations in `Review.request.test.ts` and `ReviewSaver.test.ts` fail because the fact has no `taskId` (`expected ... to equal ... taskId: null`); in `toAssignmentRecordValues.test.ts` the new facts hit no `case` and fall through to `undefined` (`flatMap` of `undefined` yields `[undefined]`, not `[]`).

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/ReviewFailRestartEvents.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50`
Expected: the same failures (the domain-only files do not touch storage).

- [ ] **Step 3: The transition names, facts and the automation actor**

In `packages/api-workflows/src/domain/review/errors.ts`, replace `ReviewTransitionName` with:

```ts
export type ReviewTransitionName =
    | "reach"
    | "start"
    | "takeOver"
    | "approve"
    | "reject"
    | "cancel"
    | "reassign"
    | "fail"
    | "restart";
```

In `packages/api-workflows/src/domain/review/facts.ts`, replace `ReviewStepReachedFact` with:

```ts
export interface ReviewStepReachedFact {
    type: "stepReached";
    occurredOn: string;
    /** Who caused the step to be reached: the requester or the approver of the previous step. */
    actor: Actor;
    /** Who got the step; `null` when it went to the pool. */
    owner: Actor | null;
    change: ReviewStepChange;
    /** `null` when an automation step was reached: nothing assigns it (R140). */
    assignment: ReviewStepAssignment | null;
    /** The background task of an automation step (D57, R140); `null` for a review step. */
    taskId: string | null;
    /** The resolver's skips and outcome; `ReviewSaver` writes them after the save (R117). */
    records: AssignmentDecision[];
}
```

add after `ReviewStepRejectedFact`:

```ts
export interface ReviewStepFailedFact {
    type: "stepFailed";
    occurredOn: string;
    /** The step's owner (the automation actor), else the requester (R140). */
    actor: Actor;
    change: ReviewStepChange;
    /** The fixed reason text stored in the step's `comment` (R146). */
    reason: string;
}

export interface ReviewStepRestartedFact {
    type: "stepRestarted";
    occurredOn: string;
    /** Who restarted: the requester or a user with `reassign` (the wrapper checked it, D132). */
    actor: Actor;
    change: ReviewStepChange;
    /** The failed attempt's task, now the last entry of `runs`. */
    previousTaskId: string | null;
}
```

and extend the union:

```ts
export type ReviewFact =
    | ReviewRequestedFact
    | ReviewStepReachedFact
    | ReviewStepStartedFact
    | ReviewStepTakenOverFact
    | ReviewStepReassignedFact
    | ReviewStepApprovedFact
    | ReviewStepRejectedFact
    | ReviewStepFailedFact
    | ReviewStepRestartedFact
    | ReviewCancelledFact
    | ReviewApprovedFact;
```

In `packages/api-workflows/src/domain/assignment/toAssignmentRecordValues.ts`, replace the second `case` group (the doc comment above the function stays as it is: it already says every fact type has a case):

```ts
        case "requested":
        case "stepApproved":
        case "stepRejected":
        case "stepFailed":
        case "stepRestarted":
        case "cancelled":
        case "approved":
            return [];
```

Create `packages/api-workflows/src/domain/automation/getAutomationActor.ts`:

```ts
import type { Actor } from "~/domain/review/types.js";

/**
 * The actor of an automation step (spec 5.2, D58, D107, R141): the requester's id and name with
 * the `automation` type, so the step's owner, its approve and reject facts and its `fail` facts
 * say who the automation acts for. `identityType` is omitted: an automation is not an identity.
 * Pure.
 */
export const getAutomationActor = (requester: Actor): Actor => {
    return {
        type: "automation",
        id: requester.id,
        displayName: requester.displayName
    };
};
```

- [ ] **Step 4: The aggregate**

In `packages/api-workflows/src/domain/review/Review.ts`:

1. Add the parameter interfaces after `ReviewReassignParams`:

```ts
export interface ReviewReachRunParams {
    /** Who caused the step to be reached: the requester or the approver of the previous step. */
    actor: Actor;
    /** The automation actor (R141); `getAutomationActor(requester)`. */
    owner: Actor;
    /** The background task started for this attempt; `null` when none was started. */
    taskId: string | null;
    now: string;
}

export interface ReviewFailParams extends ReviewStepParams {
    /** A fixed reason text (R146); stored in the step's `comment` and on its `runs` entry. */
    reason: string;
    now: string;
}

export interface ReviewRestartParams extends ReviewStepParams {
    /** Who restarts; recorded on the fact (the wrapper checked it, D132). */
    actor: Actor;
    now: string;
}
```

2. Add the error types after `ReviewReassignTransitionError`:

```ts
/** Fail needs the current step; the check for a finished review is `InvalidState` (R140). */
export type ReviewFailError = ReviewInvalidStateError | ReviewStepNotCurrentError;

/** Restart needs a failed current step (R140, R153). */
export type ReviewRestartError = ReviewInvalidStateError | ReviewStepNotCurrentError;
```

3. In `Review.request`, the step literal gains `taskId: null, runs: []` (Task 4).

4. In `reach`, the pushed fact gains `taskId: null`:

```ts
        this.facts.push({
            type: "stepReached",
            occurredOn: params.now,
            actor: { ...params.actor },
            owner: step.owner ? { ...step.owner } : null,
            change: { stepId: step.id, fromState: "pending", toState: step.state },
            assignment: structuredClone(resolution.assignment),
            taskId: null,
            records: structuredClone(resolution.records)
        });
        return Result.ok();
    }
```

5. Add `reachRun` directly after `reach`:

```ts

    /**
     * Reaches the `pending` current step of an automation (spec 5.2, R140): the automation actor
     * owns it at once, there is no pool and no assignment, and the id of the task started for it
     * is stored. The caller triggered the task as the requester (R149) before saving.
     */
    public reachRun(params: ReviewReachRunParams): Result<void, ReviewInvalidStateError> {
        const current = this.getCurrentStepIn("reach", "pending");
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;

        step.candidateTeamIds = [];
        step.assignment = null;
        step.assignmentSource = null;
        step.owner = { ...params.owner };
        step.state = "inReview";
        step.reachedOn = params.now;
        step.startedOn = params.now;
        step.taskId = params.taskId;

        this.facts.push({
            type: "stepReached",
            occurredOn: params.now,
            actor: { ...params.actor },
            owner: { ...params.owner },
            change: { stepId: step.id, fromState: "pending", toState: "inReview" },
            assignment: null,
            taskId: params.taskId,
            records: []
        });
        return Result.ok();
    }
```

6. Add `fail`, `checkRestart` and `restart` after `reassign` (before `prepareForSave`):

```ts

    /**
     * Fails the current step with a reason (spec 5.1, D8, R140): a `pending` or `inReview` step,
     * the owner kept, `comment` = the reason. The review stays in progress; the step can be
     * restarted. An already failed step is a no-op without a fact, so a late hook, stuck
     * detection or a second failure path cannot fail it twice or overwrite its reason.
     */
    public fail(params: ReviewFailParams): Result<void, ReviewFailError> {
        const guard = this.guardFail(params.stepId);
        if (guard.isFail()) {
            return Result.fail(guard.error);
        }
        const step = guard.value;
        if (step.state === "failed") {
            return Result.ok();
        }
        const fromState = step.state;

        step.state = "failed";
        step.comment = params.reason;
        step.finishedOn = params.now;

        this.facts.push({
            type: "stepFailed",
            occurredOn: params.now,
            actor: { ...(step.owner ?? this.data.createdBy) },
            change: { stepId: step.id, fromState, toState: "failed" },
            reason: params.reason
        });
        return Result.ok();
    }

    /**
     * Restart is possible on a failed current step only (spec 5.1, D8, R153); a rejected step is
     * final (D10). Who may restart (requester or `reassign`) is checked by the app wrapper with
     * `canRestartByPermission` (D132, R41).
     */
    public checkRestart(params: ReviewStepParams): Result<void, ReviewRestartError> {
        return Review.toCheck(this.guardRestart(params));
    }

    /**
     * Moves the failed attempt into `runs` and makes the step `pending` again (R140, D82). The
     * owner stays; the times of the attempt are cleared because a `pending` step has none. The
     * caller re-reaches the step afterwards (`reachRun`).
     */
    public restart(params: ReviewRestartParams): Result<void, ReviewRestartError> {
        const guard = this.guardRestart(params);
        if (guard.isFail()) {
            return Result.fail(guard.error);
        }
        const step = guard.value;
        const previousTaskId = step.taskId;

        step.runs.push({
            taskId: step.taskId,
            startedOn: step.startedOn ?? step.reachedOn ?? step.finishedOn ?? params.now,
            finishedOn: step.finishedOn,
            outcome: "failed",
            reason: step.comment
        });
        step.state = "pending";
        step.comment = null;
        step.taskId = null;
        step.reachedOn = null;
        step.startedOn = null;
        step.finishedOn = null;

        this.facts.push({
            type: "stepRestarted",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "failed", toState: "pending" },
            previousTaskId
        });
        return Result.ok();
    }
```

7. Add the guards after `guardReassignTo` (before `toCheck`):

```ts

    /** The current step when it can fail: `pending`, `inReview`, or already `failed` (R140). */
    private guardFail(stepId: string): Result<ReviewStep, ReviewFailError> {
        const step = this.findCurrentStep();
        if (this.data.state === "inProgress" && step && step.id !== stepId) {
            return Result.fail(
                new ReviewStepNotCurrentError({
                    reviewId: this.data.id,
                    stepId,
                    currentStepId: step.id
                })
            );
        }
        const failable = step?.state === "pending" || step?.state === "inReview";
        if (this.data.state !== "inProgress" || !step || !(failable || step.state === "failed")) {
            return Result.fail(
                new ReviewInvalidStateError({
                    reviewId: this.data.id,
                    transition: "fail",
                    reviewState: this.data.state,
                    stepId: step?.id ?? null,
                    stepState: step?.state ?? null
                })
            );
        }
        return Result.ok(step);
    }

    /** The current step when it is failed (R140): rejected, in review and the rest are refused. */
    private guardRestart(params: ReviewStepParams): Result<ReviewStep, ReviewRestartError> {
        return this.getRequestedStepIn("restart", "failed", params.stepId);
    }
```

- [ ] **Step 5: The events and the saver**

In `packages/api-workflows/src/features/review/events.ts`, add `ReviewStepFailedFact` and `ReviewStepRestartedFact` to the fact type import (alphabetical):

```ts
import type {
    ReviewApprovedFact,
    ReviewCancelledFact,
    ReviewFact,
    ReviewRequestedFact,
    ReviewStepApprovedFact,
    ReviewStepFailedFact,
    ReviewStepReachedFact,
    ReviewStepReassignedFact,
    ReviewStepRejectedFact,
    ReviewStepRestartedFact,
    ReviewStepStartedFact,
    ReviewStepTakenOverFact
} from "~/domain/review/facts.js";
```

add after the `StepRejected` section (before `// Cancelled`):

```ts
// ============================================================================
// StepFailed (the review stays in progress; the step can be restarted, D8)
// ============================================================================

export class ReviewStepFailedEvent extends DomainEvent<ReviewEventPayload<ReviewStepFailedFact>> {
    eventType = "Workflows/Review/StepFailed" as const;

    getHandlerAbstraction() {
        return ReviewStepFailedEventHandler;
    }
}

export const ReviewStepFailedEventHandler = createAbstraction<
    IEventHandler<ReviewStepFailedEvent>
>("ReviewStepFailedEventHandler");

export namespace ReviewStepFailedEventHandler {
    export type Interface = IEventHandler<ReviewStepFailedEvent>;
    export type Event = ReviewStepFailedEvent;
}

// ============================================================================
// StepRestarted (the failed step is pending again; the caller re-reaches it)
// ============================================================================

export class ReviewStepRestartedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepRestartedFact>
> {
    eventType = "Workflows/Review/StepRestarted" as const;

    getHandlerAbstraction() {
        return ReviewStepRestartedEventHandler;
    }
}

export const ReviewStepRestartedEventHandler = createAbstraction<
    IEventHandler<ReviewStepRestartedEvent>
>("ReviewStepRestartedEventHandler");

export namespace ReviewStepRestartedEventHandler {
    export type Interface = IEventHandler<ReviewStepRestartedEvent>;
    export type Event = ReviewStepRestartedEvent;
}
```

and extend the union:

```ts
export type ReviewEvent =
    | ReviewRequestedEvent
    | ReviewStepReachedEvent
    | ReviewStepStartedEvent
    | ReviewStepTakenOverEvent
    | ReviewStepReassignedEvent
    | ReviewStepApprovedEvent
    | ReviewStepRejectedEvent
    | ReviewStepFailedEvent
    | ReviewStepRestartedEvent
    | ReviewCancelledEvent
    | ReviewApprovedEvent;
```

In `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`, add the two events to the import from `../events.js` (alphabetical: `ReviewStepFailedEvent` after `ReviewStepApprovedEvent`, `ReviewStepRestartedEvent` after `ReviewStepRejectedEvent`) and two cases to `createEvent`, after `"stepRejected"`:

```ts
            case "stepRejected":
                return new ReviewStepRejectedEvent({ review, fact });
            case "stepFailed":
                return new ReviewStepFailedEvent({ review, fact });
            case "stepRestarted":
                return new ReviewStepRestartedEvent({ review, fact });
            case "cancelled":
                return new ReviewCancelledEvent({ review, fact });
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.stepRun.test.ts packages/api-workflows/__tests__/domain/getAutomationActor.test.ts packages/api-workflows/__tests__/review/ReviewFailRestartEvents.test.ts packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/domain/Review.stepRun.test.ts packages/api-workflows/__tests__/domain/getAutomationActor.test.ts packages/api-workflows/__tests__/review/ReviewFailRestartEvents.test.ts packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50`
Expected: PASS.

Also run the existing files that cover the changed aggregate, facts and saver: `yarn test packages/api-workflows/__tests__/domain/Review.checks.test.ts packages/api-workflows/__tests__/domain/Review.decisions.test.ts packages/api-workflows/__tests__/domain/Review.reassign.test.ts packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts 2>&1 | tail -50`, then the same with `yarn test:os` (one run at a time). Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the automation reach, fail and restart transitions with their facts and events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
