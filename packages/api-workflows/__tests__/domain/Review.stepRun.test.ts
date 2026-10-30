import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import type { ReviewInvalidStateErrorData } from "~/domain/review/errors.js";
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
        expectOk(review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER }));
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
        expect(
            results.map(result => (result.error.data as ReviewInvalidStateErrorData).stepState)
        ).toEqual(["inReview", "awaiting", "pending"]);
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
            review.restart({ stepId: AUTOMATION_STEP_ID, actor: reviewer, now: EVEN_LATER }).isOk()
        ).toBe(true);
    });
});

describe("Review reach by step type", () => {
    it("refuses to reach a run step as a review step", () => {
        const review = createPendingAutomationReview();
        review.pullFacts();

        const result = review.reach({
            resolution: {
                owner: reviewer,
                candidateTeamIds: [],
                assignment: { source: "picked" },
                records: []
            },
            actor: requester,
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(review.toData().steps[0]).toMatchObject({ state: "pending", owner: null });
        expect(review.pullFacts()).toEqual([]);
    });

    it("refuses to reach a review step as a run step", () => {
        // A review step that is still to be reached.
        const data = createRequestedReview().toData();
        data.steps[0] = {
            ...data.steps[0],
            state: "pending",
            owner: null,
            candidateTeamIds: [],
            assignment: null,
            assignmentSource: null,
            reachedOn: null
        };
        const review = Review.fromData(data);

        const result = review.reachRun({
            actor: requester,
            owner: automationActor,
            taskId: "task-1",
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(review.toData().steps[0]).toMatchObject({ state: "pending", taskId: null });
        expect(review.pullFacts()).toEqual([]);
    });
});

describe("Review task ids (R151, R256)", () => {
    it("names the running task only while the current step is in review", () => {
        expect(createRunningAutomationReview("task-1").getRunningTaskId()).toBe("task-1");
        expect(createPendingAutomationReview().getRunningTaskId()).toBeNull();
        expect(createFailedAutomationReview(REASON, LATER).getRunningTaskId()).toBeNull();
        expect(createRequestedReview().getRunningTaskId()).toBeNull();
    });

    it("lists the task of every attempt, earlier attempts first", () => {
        const review = createFailedAutomationReview(REASON, LATER);
        expectOk(review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER }));
        expectOk(
            review.reachRun({
                actor: requester,
                owner: automationActor,
                taskId: "task-2",
                now: EVEN_LATER
            })
        );

        expect(review.getTaskIds()).toEqual(["task-1", "task-2"]);
        expect(review.getRunningTaskId()).toBe("task-2");
        expect(createRequestedReview().getTaskIds()).toEqual([]);
    });
});
