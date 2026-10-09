import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { MISSING_TARGET_ID } from "~tests/__helpers/FakeReviewTargetLoader.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { FailingReviewTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import {
    ThrowingReviewTargetLoader,
    TARGET_LOAD_THROW
} from "~tests/__helpers/ThrowingReviewTargetLoader.js";
import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import {
    ARTICLE_MODEL,
    createWorkflowValues,
    expectOk,
    otherReviewer,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";

describe("RequestReviewUseCase", () => {
    it("requests a review and reaches the first step through the pool", async () => {
        const { context, workflow } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput());

        expect(result.isOk()).toBe(true);
        const review = result.value;
        expect(review).toMatchObject({
            workflowId: workflow.id,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article article-1",
            isActive: true,
            state: "inProgress",
            currentStepId: "legal",
            currentStepState: "awaiting",
            currentOwnerId: null,
            currentCandidateTeamIds: [REVIEW_TEAM_ID],
            createdBy: requester,
            workflow: { name: workflow.name, models: workflow.models }
        });
        expect(review.targetContext).toEqual({ ...targetContext, title: "Article article-1" });
        expect(review.steps.map(step => step.state)).toEqual(["awaiting", "pending"]);
        expect(review.steps[0].assignment).toEqual({ source: "pool" });
        expect(recordedSyncs.map(sync => sync.systemWorkflow)).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "awaiting"
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);

        const read = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(read.value).toEqual(review);
    });

    it("stores picks on the review steps; the default resolver leaves the step in the pool", async () => {
        const { context } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(
                createRequestInput({ picks: [{ stepId: "legal", userId: otherReviewer.id }] })
            );

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({
            pickedUserId: otherReviewer.id,
            state: "awaiting",
            owner: null
        });
    });

    it("rejects picks for unknown steps or steps without manual picks", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);

        const unknownStep = await requestReview.execute(
            createRequestInput({ picks: [{ stepId: "missing", userId: otherReviewer.id }] })
        );
        const noPicks = await requestReview.execute(
            createRequestInput({ picks: [{ stepId: "editorial", userId: otherReviewer.id }] })
        );

        expect(unknownStep.error.code).toBe("Workflows/Review/Validation");
        expect(noPicks.error.code).toBe("Workflows/Review/Validation");
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("allows one active review per target revision", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);
        const first = await requestReview.execute(createRequestInput());

        const second = await requestReview.execute(createRequestInput());

        expect(second.isFail()).toBe(true);
        expect(second.error.code).toBe("Workflows/Review/AlreadyActive");
        expect(second.error.data).toEqual({
            reviewId: first.value.id,
            targetRevisionId: "article-1#0001"
        });

        const otherRevision = await requestReview.execute(
            createRequestInput({ targetRevisionId: "article-1#0002" })
        );
        expect(otherRevision.isOk()).toBe(true);
    });

    it("fails with TargetNotFound when the target is missing or no loader handles the model", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);
        await context.container.resolve(StoreWorkflowUseCase).execute({
            workflow: createWorkflowValues({ id: "workflow-pages", models: ["wb.page"] })
        });

        const missing = await requestReview.execute(
            createRequestInput({
                targetId: MISSING_TARGET_ID,
                targetRevisionId: `${MISSING_TARGET_ID}#0001`
            })
        );
        const noLoader = await requestReview.execute(
            createRequestInput({
                model: "wb.page",
                targetId: "page-1",
                targetRevisionId: "page-1#0001"
            })
        );

        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(missing.error.data).toEqual({
            model: ARTICLE_MODEL,
            targetRevisionId: `${MISSING_TARGET_ID}#0001`
        });
        expect(noLoader.error.code).toBe("Workflows/Review/TargetNotFound");
    });

    it("uses the last registered loader when several can load the model", async () => {
        class FirstLoaderImpl implements ReviewTargetLoader.Interface {
            canLoad(): boolean {
                return true;
            }
            async load(): Promise<ReviewTargetLoader.Target | null> {
                return { title: "From first", context: { ...targetContext, title: "From first" } };
            }
        }
        class SecondLoaderImpl implements ReviewTargetLoader.Interface {
            canLoad(): boolean {
                return true;
            }
            async load(): Promise<ReviewTargetLoader.Target | null> {
                return {
                    title: "From second",
                    context: { ...targetContext, title: "From second" }
                };
            }
        }
        const { context } = await createReviewContext({
            setup: container => {
                container.register(
                    ReviewTargetLoader.createImplementation({
                        implementation: FirstLoaderImpl,
                        dependencies: []
                    })
                );
                container.register(
                    ReviewTargetLoader.createImplementation({
                        implementation: SecondLoaderImpl,
                        dependencies: []
                    })
                );
            }
        });

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput());

        expect(expectOk(result).title).toBe("From second");
    });

    it("fails with a persistence error and saves nothing when the loader throws", async () => {
        const { context } = await createReviewContext({
            setup: container => {
                container.register(ThrowingReviewTargetLoader);
            }
        });

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput());

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(result.error.message).toContain(TARGET_LOAD_THROW);
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

    it("keeps the requested review when the target sync fails", async () => {
        const { context } = await createReviewContext({
            setup: container => {
                container.register(FailingReviewTargetSync);
            }
        });
        const requestReview = context.container.resolve(RequestReviewUseCase);

        const result = await requestReview.execute(createRequestInput());

        expect(result.isFail()).toBe(true);
        const error = result.error;
        if (error.code !== "Workflows/Review/TargetSync") {
            throw error;
        }
        const read = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: error.data.review.id })
        );
        expect(error.data).toEqual({ review: read });
        expect(read).toMatchObject({ isActive: true, currentStepState: "awaiting" });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);

        // The saved review is active, so a retry is refused instead of creating a second one.
        const retry = await requestReview.execute(createRequestInput());
        expect(retry.error.code).toBe("Workflows/Review/AlreadyActive");
    });

    it("fails when no workflow is bound to the model", async () => {
        const { context } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput({ model: "cms.unbound" }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/WorkflowNotFound");
        expect(result.error.data).toEqual({ model: "cms.unbound" });
    });
});

describe("GetReviewUseCase", () => {
    it("returns NotFound for an unknown review", async () => {
        const { context } = await createReviewContext();

        const result = await context.container.resolve(GetReviewUseCase).execute({ id: "missing" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});
