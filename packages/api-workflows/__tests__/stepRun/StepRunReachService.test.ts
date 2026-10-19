import { beforeEach, describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    abortedTasks,
    fakeTaskFaults,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import {
    AUTOMATION_STEP_ID,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    expectOk,
    NOW,
    otherReviewer,
    requester,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import { getAiActor } from "~/domain/ai/getAiActor.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { AI_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepRunReachService } from "~/features/stepRun/StepRunReachService/index.js";

const AI_STEP_ID = "ai-check";
const AI_ACTOR = getAiActor(requester);
const AUTOMATION_ACTOR = getAutomationActor(requester);
const AI_START_FAILURE = "The AI review could not be started.";
const AUTOMATION_START_FAILURE = "The automation could not be started.";

/** A pending `ai` step "AI check" followed by the review step "Editorial review". */
const createAiReview = (): Review => {
    const workflow = createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: AI_STEP_ID, title: "AI check" }),
                type: AI_STEP_TYPE,
                config: { instructions: "Check the tone.", model: "openai/gpt-5", tools: [] }
            },
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ]
    });
    return expectOk(
        Review.request({
            id: "review-1",
            workflow,
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

const createContext = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
        }
    });
    return context;
};

describe("StepRunReachService (R143, R149, R159, R164, R168)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    it("is registered once, with the engine", async () => {
        const context = await createContext();

        expect(context.container.resolveAll(StepRunReachService)).toHaveLength(1);
    });

    it("triggers the step run task as the requester, not as the actor who caused the reach", async () => {
        const context = await createContext();
        const identityContext = context.container.resolve(IdentityContext);
        const identityBefore = identityContext.getIdentity().id;
        const review = createAiReview();
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: otherReviewer,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([
            {
                id: "task-1",
                definition: "workflowsStepRun",
                name: "Workflow step: AI check",
                input: { reviewId: "review-1", stepId: AI_STEP_ID },
                identityId: requester.id,
                identityType: "admin"
            }
        ]);
        expect(triggeredTasks[0].identityId).not.toBe(otherReviewer.id);
        expect(identityContext.getIdentity().id).toBe(identityBefore);
        expect(identityBefore).not.toBe(requester.id);
    });

    it("reaches the step in review with the task id, owned by the given owner", async () => {
        const context = await createContext();
        const review = createAiReview();
        const [step] = review.toData().steps;

        await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        expect(review.toData().steps[0]).toMatchObject({
            id: AI_STEP_ID,
            state: "inReview",
            owner: AI_ACTOR,
            taskId: "task-1",
            assignment: null,
            assignmentSource: null,
            candidateTeamIds: [],
            reachedOn: NOW,
            startedOn: NOW
        });
        const reached = review.pullFacts().filter(fact => fact.type === "stepReached");
        expect(reached).toHaveLength(1);
        expect(reached[0]).toMatchObject({ taskId: "task-1", assignment: null, records: [] });
        expect(abortedTasks).toEqual([]);
    });

    it("uses the owner the caller gives, whatever the step type", async () => {
        const context = await createContext();
        const review = createAiReview();
        const [step] = review.toData().steps;

        await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AUTOMATION_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AUTOMATION_START_FAILURE
        });

        expect(review.toData().steps[0].owner).toEqual(AUTOMATION_ACTOR);
    });

    it("fails the step with the given reason and triggers nothing when `failure` is set", async () => {
        const context = await createContext();
        const review = createAiReview();
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: 'The AI tool "readTarget" is not available.',
            startFailure: AI_START_FAILURE
        });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([]);
        expect(abortedTasks).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: 'The AI tool "readTarget" is not available.',
            taskId: null,
            owner: AI_ACTOR,
            finishedOn: NOW
        });
        expect(review.pullFacts().map(fact => fact.type)).toEqual([
            "requested",
            "stepReached",
            "stepFailed"
        ]);
    });

    it("fails the step with `startFailure` when the trigger fails, and logs the raw error", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "fail";
        fakeTaskFaults.triggerMessage = "The queue is full";
        const review = createAiReview();
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: AI_START_FAILURE,
            taskId: null
        });
        expect(abortedTasks).toEqual([]);
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not start the step run task."
        ]);
        expect((loggedErrors[0].fields.err as Error).message).toBe("The queue is full");
        expect(loggedErrors[0].fields).toMatchObject({ reviewId: "review-1", stepId: AI_STEP_ID });
    });

    it("fails the step with `startFailure` when the trigger throws, and restores the identity", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "throw";
        const identityContext = context.container.resolve(IdentityContext);
        const identityBefore = identityContext.getIdentity().id;
        const review = createAiReview();
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: AI_START_FAILURE
        });
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not start the step run task."
        ]);
        expect((loggedErrors[0].fields.error as Error).message).toBe("The task service is down");
        expect(identityContext.getIdentity().id).toBe(identityBefore);
    });

    it("never puts a raw trigger message into the step, however long", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "fail";
        fakeTaskFaults.triggerMessage = "x".repeat(900);
        const review = createAiReview();
        const [step] = review.toData().steps;

        await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        const [failedStep] = review.toData().steps;
        expect(failedStep.comment).toBe(AI_START_FAILURE);
        expect(JSON.stringify(failedStep)).not.toContain("xxxxx");
    });

    it("aborts the triggered task and returns the error when the step cannot be reached after it", async () => {
        const context = await createContext();
        // The step is already in review, so `reachRun` refuses it after the trigger succeeded.
        const review = createRunningAutomationReview("task-0");
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AUTOMATION_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AUTOMATION_START_FAILURE
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(triggeredTasks.map(task => task.id)).toEqual(["task-1"]);
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review could not be saved." }]);
        expect(review.toData().steps[0]).toMatchObject({
            id: AUTOMATION_STEP_ID,
            state: "inReview",
            taskId: "task-0"
        });
    });

    it("returns the error and aborts nothing when the step cannot be reached and no task exists", async () => {
        const context = await createContext();
        const review = createRunningAutomationReview("task-0");
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AUTOMATION_ACTOR,
            now: NOW,
            failure: "The automation is not available.",
            startFailure: AUTOMATION_START_FAILURE
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(triggeredTasks).toEqual([]);
        expect(abortedTasks).toEqual([]);
    });
});
