import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { resetFakeTasks, triggeredTasks } from "~tests/__helpers/FakeTaskService.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewStepNotCurrentError } from "~/domain/review/errors.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { StepType } from "~/features/stepTypes/StepType/index.js";
import { createTestStepType } from "~tests/__helpers/TestStepType.js";

/**
 * A step type whose `reach` fails with `ReviewStepNotCurrentError`. Local to this test: the shared
 * `createTestStepType` always reaches ok.
 */
class NotCurrentStepTypeImpl implements StepType.Interface {
    public readonly type = "not-current";
    public readonly title = "Not current";
    public readonly configSchema = null;

    public async describeAvailability(): Promise<StepType.Availability> {
        return { available: true, unavailableReason: null };
    }

    public validate(params: StepType.ValidateParams) {
        return Result.ok(params.step);
    }

    public async reach(params: StepType.ReachParams) {
        return Result.fail(
            new ReviewStepNotCurrentError({
                reviewId: params.review.toData().id,
                stepId: params.step.id,
                currentStepId: null
            })
        );
    }
}

const NotCurrentStepType = StepType.createImplementation({
    implementation: NotCurrentStepTypeImpl,
    dependencies: []
});

const createReview = (stepType: string): Review => {
    const workflow = createWorkflow({
        steps: [
            { ...createReviewStep({ id: "first", title: "First step" }), type: stepType },
            createReviewStep({ id: "second", title: "Second step" })
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

describe("ReviewStepReacher dispatches by step type (R131)", () => {
    beforeEach(() => {
        resetFakeTasks();
    });

    it("reaches a review step through the review step type", async () => {
        const { context } = await createContextHandler();
        const review = createReview("review");

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            candidateTeamIds: [REVIEW_TEAM_ID],
            taskId: null
        });
        expect(triggeredTasks).toEqual([]);
    });

    it("leaves a step of a registered custom type to that type's reach", async () => {
        const { implementation } = createTestStepType({ type: "custom" });
        const { context } = await createContextHandler({
            setup: container => {
                container.register(implementation);
            }
        });
        const review = createReview("custom");

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        // The test step type's `reach` returns ok and changes nothing: the step is neither failed
        // as unavailable nor assigned by the review resolver.
        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({ state: "pending", taskId: null });
        expect(review.pullFacts().map(fact => fact.type)).toEqual(["requested"]);
    });

    it("fails the step of a type that is not registered", async () => {
        const { context } = await createContextHandler();
        const review = createReview("mystery");

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: 'The step type "mystery" is not available.',
            finishedOn: NOW,
            taskId: null
        });
        expect(review.pullFacts().map(fact => fact.type)).toEqual(["requested", "stepFailed"]);
        expect(triggeredTasks).toEqual([]);
    });

    it("fails a step of an unknown type, the fact carrying the requester as actor", async () => {
        const { context } = await createContextHandler();
        const review = createReview("mystery");

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        const failed = review.pullFacts().find(fact => fact.type === "stepFailed");
        expect(failed).toMatchObject({ actor: requester });
    });

    it("returns the error of a step type's reach instead of swallowing it (R159)", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                container.register(NotCurrentStepType);
            }
        });
        const review = createReview("not-current");

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
    });

    it("is a no-op when the current step is not pending", async () => {
        const { context } = await createContextHandler();
        const review = createReview("review");
        const reacher = context.container.resolve(ReviewStepReacher);

        await reacher.reach({ review, actor: requester, now: NOW });
        const again = await reacher.reach({ review, actor: requester, now: NOW });

        expect(again.isOk()).toBe(true);
        expect(review.pullFacts().filter(fact => fact.type === "stepReached")).toHaveLength(1);
    });
});
