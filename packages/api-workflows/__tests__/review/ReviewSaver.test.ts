import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    RecordingReviewTargetSync,
    recordedSyncs
} from "~tests/__helpers/RecordingReviewTargetSync.js";
import {
    FailingReviewTargetSync,
    TARGET_SYNC_FAILURE
} from "~tests/__helpers/FailingReviewTargetSync.js";
import {
    ThrowingReviewTargetSync,
    TARGET_SYNC_THROW
} from "~tests/__helpers/ThrowingReviewTargetSync.js";
import { createScopedReviewTargetSync } from "~tests/__helpers/ScopedReviewTargetSync.js";
import { callLog } from "~tests/__helpers/callLog.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import type { ReviewStepReachedEvent } from "~/features/review/events.js";

const LATER = "2026-10-09T11:00:00.000Z";

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

describe("ReviewSaver", () => {
    it("persists the review, syncs system.workflow, then publishes one event per fact", async () => {
        const context = await createRecordingContext();
        const review = createRequestedReview();

        const result = await context.container.resolve(ReviewSaver).save(review);

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            currentStepId: "legal",
            currentStepState: "awaiting",
            currentCandidateTeamIds: [REVIEW_TEAM_ID],
            lastChangedOn: NOW
        });
        const stored = await context.container.resolve(ReviewRepository).get(review.id);
        expect(stored.value).toEqual(result.value);
        expect(recordedSyncs).toEqual([
            {
                review: result.value,
                systemWorkflow: {
                    workflowId: "workflow-1",
                    reviewState: "inProgress",
                    stepId: "legal",
                    stepName: "Legal review",
                    stepState: "awaiting"
                }
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);
        const reached = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepReached"
        ) as ReviewStepReachedEvent;
        expect(reached.payload.review).toEqual(result.value);
        expect(reached.payload.fact).toEqual({
            type: "stepReached",
            occurredOn: NOW,
            actor: requester,
            owner: null,
            change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
            assignment: { source: "pool" }
        });
    });

    it("hands null to the target sync after cancel", async () => {
        const context = await createRecordingContext();
        const saver = context.container.resolve(ReviewSaver);
        const saved = expectOk(await saver.save(createRequestedReview()));
        recordedSyncs.length = 0;
        recordedEvents.length = 0;
        const review = Review.fromData(saved);
        expectOk(review.cancel({ actor: requester, now: LATER }));

        const result = await saver.save(review);

        expect(result.value).toMatchObject({
            state: "cancelled",
            isActive: false,
            currentStepId: null,
            lastChangedOn: LATER
        });
        expect(recordedSyncs.map(sync => sync.systemWorkflow)).toEqual([null]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);
    });

    it("syncs before it publishes the first event", async () => {
        callLog.length = 0;
        const context = await createRecordingContext();

        expectOk(await context.container.resolve(ReviewSaver).save(createRequestedReview()));

        const ownCalls = callLog.filter(
            call => call === "sync" || call.startsWith("event:Workflows/")
        );
        expect(ownCalls).toEqual([
            "sync",
            "event:Workflows/Review/Requested",
            "event:Workflows/Review/StepReached"
        ]);
    });

    it("calls only the sync whose canSync matches the review model", async () => {
        callLog.length = 0;
        const { context } = await createContextHandler({
            setup: container => {
                container.register(createScopedReviewTargetSync("article", ARTICLE_MODEL));
                container.register(createScopedReviewTargetSync("page", "wb.page"));
            }
        });

        expectOk(await context.container.resolve(ReviewSaver).save(createRequestedReview()));

        expect(callLog).toEqual(["sync:article"]);
    });

    it("calls the last registered sync when several match the model", async () => {
        callLog.length = 0;
        const { context } = await createContextHandler({
            setup: container => {
                container.register(createScopedReviewTargetSync("first", ARTICLE_MODEL));
                container.register(createScopedReviewTargetSync("second", ARTICLE_MODEL));
            }
        });

        expectOk(await context.container.resolve(ReviewSaver).save(createRequestedReview()));

        expect(callLog).toEqual(["sync:second"]);
    });

    it("saves and publishes events when no sync matches the model", async () => {
        recordedEvents.length = 0;
        const { context } = await createContextHandler({
            setup: container => {
                container.register(createScopedReviewTargetSync("page", "wb.page"));
                container.registerDecorator(RecordingEventPublisher);
            }
        });

        const result = await context.container.resolve(ReviewSaver).save(createRequestedReview());

        expect(result.isOk()).toBe(true);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);
    });

    it("turns a throwing target sync into a target sync error and still publishes events", async () => {
        recordedEvents.length = 0;
        const { context } = await createContextHandler({
            setup: container => {
                container.register(ThrowingReviewTargetSync);
                container.registerDecorator(RecordingEventPublisher);
            }
        });
        const review = createRequestedReview();

        const result = await context.container.resolve(ReviewSaver).save(review);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/TargetSync");
        expect(result.error.message).toContain(TARGET_SYNC_THROW);
        const stored = expectOk(await context.container.resolve(ReviewRepository).get(review.id));
        expect(result.error.data).toEqual({ review: stored });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);
    });

    it("keeps the review saved and publishes events when the target sync fails", async () => {
        recordedEvents.length = 0;
        recordedSyncs.length = 0;
        const { context } = await createContextHandler({
            setup: container => {
                container.register(RecordingReviewTargetSync);
                container.register(FailingReviewTargetSync);
                container.registerDecorator(RecordingEventPublisher);
            }
        });
        const review = createRequestedReview();

        const result = await context.container.resolve(ReviewSaver).save(review);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/TargetSync");
        expect(result.error.message).toBe(
            `The review was saved, but updating its content failed: ${TARGET_SYNC_FAILURE}`
        );
        const stored = expectOk(await context.container.resolve(ReviewRepository).get(review.id));
        expect(result.error.data).toEqual({ review: stored });
        expect(stored).toMatchObject({ currentStepId: "legal", currentStepState: "awaiting" });
        expect(recordedSyncs).toHaveLength(1);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);
    });
});

describe("Review lifecycle defaults", () => {
    it("ships no target sync, no target loaders and a pool-only resolver", async () => {
        const { context } = await createContextHandler();
        const review = createRequestedReview({
            picks: [{ stepId: "legal", userId: "user-picked" }]
        }).toData();

        expect(context.container.resolveAll(ReviewTargetSync)).toEqual([]);
        expect(context.container.resolveAll(ReviewTargetLoader)).toEqual([]);

        const resolution = await context.container
            .resolve(StepAssignmentResolver)
            .resolve({ review, step: review.steps[0] });

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool" }
        });
    });

    it("reaches the current pending step through the resolver once", async () => {
        const { context } = await createContextHandler();
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
        const reacher = context.container.resolve(ReviewStepReacher);

        const first = await reacher.reach({ review, actor: requester, now: NOW });
        const second = await reacher.reach({ review, actor: requester, now: NOW });

        expect(first.isOk()).toBe(true);
        expect(second.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            candidateTeamIds: [REVIEW_TEAM_ID]
        });
        expect(review.pullFacts().filter(fact => fact.type === "stepReached")).toHaveLength(1);
    });
});
