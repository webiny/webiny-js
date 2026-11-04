import { describe, expect, it } from "vitest";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import {
    createRequestedReview,
    createReviewStep,
    createStartedReview,
    createWorkflow,
    expectOk,
    aiActor,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import type { Workflow } from "~/domain/workflow/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import {
    ReviewEntryMapper,
    type ReviewEntryValues
} from "~/features/review/shared/ReviewEntryMapper.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

/** "legal" is a review step, "editorial" an AI step, which is reached as a run (`reachRun`). */
const createMixedWorkflow = (): Workflow => {
    return createWorkflow({
        steps: [
            createReviewStep({ id: "legal", title: "Legal review" }),
            { ...createReviewStep({ id: "editorial", title: "AI check" }), type: "ai" }
        ]
    });
};

describe("Review currentStepType (D112, R93)", () => {
    it("is null until the first save prepares the review, then the current step's type", () => {
        const review = createRequestedReview();

        expect(review.toData().currentStepType).toBeNull();

        review.prepareForSave();
        expect(review.toData()).toMatchObject({
            currentStepId: "legal",
            currentStepType: "review"
        });
    });

    it("follows the current step when the review moves to the next step", () => {
        const review = createStartedReview({ workflow: createMixedWorkflow() });
        expectOk(
            review.approve({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: null,
                now: LATER
            })
        );
        expectOk(
            review.reachRun({ actor: reviewer, owner: aiActor, taskId: "task-1", now: LATER })
        );

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            currentStepId: "editorial",
            currentStepState: "inReview",
            currentStepType: "ai"
        });
    });

    it("keeps the rejecting step's type and clears it on cancel", () => {
        const rejected = createStartedReview({ workflow: createMixedWorkflow() });
        expectOk(
            rejected.reject({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: "Needs another pass.",
                now: LATER
            })
        );
        const cancelled = createStartedReview();
        expectOk(cancelled.cancel({ actor: requester, now: LATER }));

        rejected.prepareForSave();
        cancelled.prepareForSave();

        expect(rejected.toData()).toMatchObject({
            currentStepId: "legal",
            currentStepType: "review"
        });
        expect(cancelled.toData()).toMatchObject({
            currentStepId: null,
            currentStepType: null
        });
    });

    it("keeps the last step's type when approving it", () => {
        const review = createStartedReview({ workflow: createMixedWorkflow() });
        expectOk(
            review.approve({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: null,
                now: LATER
            })
        );
        expectOk(
            review.reachRun({ actor: reviewer, owner: aiActor, taskId: "task-1", now: LATER })
        );
        expectOk(
            review.approve({
                stepId: "editorial",
                actor: aiActor,
                actorTeamIds: [],
                comment: null,
                now: LATER
            })
        );

        review.prepareForSave();

        const data = review.toData();
        expect(data.state).toBe("approved");
        expect(data.currentStepId).toBe("editorial");
        expect(data.currentStepType).toBe("ai");
    });

    it("keeps the type when an AI step is rejected", () => {
        const review = createStartedReview({ workflow: createMixedWorkflow() });
        expectOk(
            review.approve({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: null,
                now: LATER
            })
        );
        expectOk(
            review.reachRun({ actor: reviewer, owner: aiActor, taskId: "task-1", now: LATER })
        );
        expectOk(
            review.reject({
                stepId: "editorial",
                actor: aiActor,
                actorTeamIds: [],
                comment: "Needs another pass.",
                now: LATER
            })
        );

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            state: "rejected",
            currentStepId: "editorial",
            currentStepType: "ai"
        });
    });

    it("is stored and read back by the use cases", async () => {
        const { context } = await createReviewContext();

        const requested = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        const read = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: requested.id })
        );
        const cancelled = expectOk(
            await context.container
                .resolve(CancelReviewUseCase)
                .execute({ reviewId: requested.id, actor: requester })
        );

        expect(requested.currentStepType).toBe("review");
        expect(read).toEqual(requested);
        expect(cancelled.currentStepType).toBeNull();
        const reread = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: requested.id })
        );
        expect(reread.currentStepType).toBeNull();
    });

    it("reads a review stored without the field as null", async () => {
        const { context } = await createContextHandler();
        const model = await context.container.resolve(ReviewModelProvider).get();
        const legacy: Partial<ReviewEntryValues> = {
            ...ReviewEntryMapper.toValues(toSaveData(createRequestedReview()))
        };
        delete legacy.currentStepType;
        expectOk(
            await context.container
                .resolve(CreateEntryUseCase)
                .execute(model, { id: "review-legacy", values: legacy })
        );

        const read = expectOk(
            await context.container.resolve(ReviewRepository).get("review-legacy")
        );

        expect(read.currentStepId).toBe("legal");
        expect(read.currentStepType).toBeNull();
    });
});
