import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { recordedEvents, workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import { ARTICLE_MODEL, expectOk, REVIEW_TEAM_ID, reviewer } from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";

describe("RequestReviewUseCase title (D135, R89)", () => {
    it("stores the requested title, trimmed", async () => {
        const { context } = await createReviewContext();

        const review = expectOk(
            await context.container
                .resolve(RequestReviewUseCase)
                .execute(createRequestInput({ title: "  Spring launch  " }))
        );

        expect(review.title).toBe("Spring launch");
        expect(review.targetContext.title).toBe("Article article-1");
    });

    it("uses the target's title when the title is missing, null or blank", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);

        const missing = expectOk(
            await requestReview.execute(createRequestInput({ targetRevisionId: "article-1#0001" }))
        );
        const empty = expectOk(
            await requestReview.execute(
                createRequestInput({ targetRevisionId: "article-1#0002", title: null })
            )
        );
        const blank = expectOk(
            await requestReview.execute(
                createRequestInput({ targetRevisionId: "article-1#0003", title: "   " })
            )
        );

        expect([missing.title, empty.title, blank.title]).toEqual([
            "Article article-1",
            "Article article-1",
            "Article article-1"
        ]);
    });

    it("refuses a short title and saves nothing", async () => {
        const { context } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput({ title: "Abc" }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("The review title must have at least 5 characters.");
        const active = expectOk(
            await context.container.resolve(ReviewRepository).getActiveByTarget({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-1#0001"
            })
        );
        expect(active).toBeNull();
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });
});

describe("RejectReviewStepUseCase comment (D100, R90)", () => {
    const setup = async () => {
        const { context } = await createReviewContext();
        const requested = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        const actorInput = {
            reviewId: requested.id,
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID]
        };
        expectOk(await context.container.resolve(StartReviewStepUseCase).execute(actorInput));
        recordedSyncs.length = 0;
        recordedEvents.length = 0;
        return {
            context,
            reviewId: requested.id,
            actorInput,
            reject: context.container.resolve(RejectReviewStepUseCase)
        };
    };

    it("refuses a short comment and saves nothing", async () => {
        const { context, reviewId, actorInput, reject } = await setup();

        const result = await reject.execute({ ...actorInput, comment: "Too short" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("A rejection needs a comment of at least 10 characters.");
        const read = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: reviewId })
        );
        expect(read).toMatchObject({ state: "inProgress", currentStepState: "inReview" });
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("checks the step state before the comment", async () => {
        const { context } = await createReviewContext();
        const requested = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );

        const result = await context.container.resolve(RejectReviewStepUseCase).execute({
            reviewId: requested.id,
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            comment: "No."
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("rejects with a comment of at least 10 characters", async () => {
        const { actorInput, reject } = await setup();

        const result = await reject.execute({ ...actorInput, comment: " Not ready. " });

        const review = expectOk(result);
        expect(review.state).toBe("rejected");
        expect(review.steps[0].comment).toBe("Not ready.");
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepRejected"]);
    });
});
