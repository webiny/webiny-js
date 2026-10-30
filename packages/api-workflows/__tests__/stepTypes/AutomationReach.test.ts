import { beforeEach, describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
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
import type { Actor } from "~/domain/review/types.js";
import { Review } from "~/domain/review/Review.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";

interface CreateReviewOptions {
    config?: unknown;
    requester?: Actor;
}

/** The automation step "Check links" followed by the review step "Editorial review". */
const createReview = (options: CreateReviewOptions = {}): Review => {
    const workflow = createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: AUTOMATION_STEP_ID, title: "Check links" }),
                type: "automation",
                config: options.config ?? { automationId: "test-automation", settings: {} }
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
            requester: options.requester ?? requester,
            now: NOW
        })
    );
};

const createContext = async (overrides: Parameters<typeof registerTestAutomation>[1] = {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerTestAutomation(container, overrides);
        }
    });
    return context;
};

const AUTOMATION_ACTOR = getAutomationActor(requester);

describe("AutomationStepType.reach (R146, R149)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    it("triggers as the requester, not as the actor who caused the reach", async () => {
        const context = await createContext();
        const identityContext = context.container.resolve(IdentityContext);
        const identityBefore = identityContext.getIdentity().id;
        const review = createReview();

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: otherReviewer, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([
            {
                id: "task-1",
                definition: "workflowsStepRun",
                name: "Workflow step: Check links",
                input: { reviewId: "review-1", stepId: AUTOMATION_STEP_ID },
                identityId: requester.id,
                identityType: "admin"
            }
        ]);
        expect(triggeredTasks[0].identityId).not.toBe(otherReviewer.id);
        expect(identityContext.getIdentity().id).toBe(identityBefore);
        expect(identityBefore).not.toBe(requester.id);
    });

    it("triggers as an admin identity when the requester has no identity type", async () => {
        const context = await createContext();
        const review = createReview({
            requester: { type: "user", id: "user-plain", displayName: "Plain Requester" }
        });

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(triggeredTasks).toHaveLength(1);
        expect(triggeredTasks[0]).toMatchObject({
            identityId: "user-plain",
            identityType: "admin"
        });
    });

    it("reaches the step in review with the task id, owned by the automation actor", async () => {
        const context = await createContext();
        const review = createReview();

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(review.toData().steps[0]).toMatchObject({
            id: AUTOMATION_STEP_ID,
            state: "inReview",
            owner: AUTOMATION_ACTOR,
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

    it("fails the step when the automation is missing", async () => {
        const context = await createContext();
        const review = createReview({
            config: { automationId: "removed-automation", settings: {} }
        });

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: 'The automation "removed-automation" is not available.',
            taskId: null,
            owner: AUTOMATION_ACTOR,
            finishedOn: NOW
        });
        expect(review.pullFacts().map(fact => fact.type)).toEqual([
            "requested",
            "stepReached",
            "stepFailed"
        ]);
    });

    it("fails the step with its own reason when the step config no longer parses (P3)", async () => {
        const context = await createContext();
        const review = createReview({ config: { settings: {} } });

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: "The automation step configuration is not valid.",
            taskId: null
        });
    });

    it("fails the step when the automation does not cover the workflow's models", async () => {
        const context = await createContext({ models: ["cms.page"] });
        const review = createReview();

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(triggeredTasks).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment:
                'The automation "test-automation" is not available for this workflow\'s models.'
        });
    });

    it("fails the step when its settings are invalid", async () => {
        const context = await createContext();
        const review = createReview({
            config: { automationId: "test-automation", settings: { mode: "explode" } }
        });

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([]);
        const [step] = review.toData().steps;
        expect(step.state).toBe("failed");
        expect(step.comment).toMatch(/^The automation settings are not valid: mode: .+\.$/);
        expect(step.taskId).toBeNull();
    });

    it("fails the step with a fixed reason when the trigger fails, and logs the error", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "fail";
        fakeTaskFaults.triggerMessage = "The queue is full";
        const review = createReview();

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: "The automation could not be started.",
            taskId: null
        });
        expect(abortedTasks).toEqual([]);
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not start the step run task."
        ]);
        expect((loggedErrors[0].fields.err as Error).message).toBe("The queue is full");
    });

    it("fails the step with the same fixed reason when the trigger throws, and logs the error", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "throw";
        const review = createReview();

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: "The automation could not be started."
        });
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not start the step run task."
        ]);
        expect((loggedErrors[0].fields.err as Error).message).toBe("The task service is down");
    });

    it("never puts a raw trigger message into the step, however long", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "fail";
        fakeTaskFaults.triggerMessage = "x".repeat(900);
        const review = createReview();

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        const [step] = review.toData().steps;
        expect(step.comment).toBe("The automation could not be started.");
        expect(JSON.stringify(step)).not.toContain("xxxxx");
    });

    it("aborts the triggered task when the step cannot be reached after it", async () => {
        const context = await createContext();
        // The step is already in review, so `reachRun` refuses it after the trigger succeeded.
        const review = createRunningAutomationReview("task-0");
        const step = review.toData().steps[0];
        const automation = context.container.resolve(StepTypeRegistryService).get("automation")!;

        const result = await automation.reach({ review, step, actor: requester, now: NOW });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(triggeredTasks.map(task => task.id)).toEqual(["task-1"]);
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review could not be saved." }]);
        expect(review.toData().steps[0]).toMatchObject({ state: "inReview", taskId: "task-0" });
    });
});
