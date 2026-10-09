import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import type { RequestReviewInput } from "~/features/review/RequestReview/index.js";
import { createContextHandler } from "./handler.js";
import { FakeReviewTargetLoader } from "./FakeReviewTargetLoader.js";
import { RecordingReviewTargetSync, recordedSyncs } from "./RecordingReviewTargetSync.js";
import { RecordingEventPublisher, recordedEvents } from "./RecordingEventPublisher.js";
import { callLog } from "./callLog.js";
import { ARTICLE_MODEL, createWorkflowValues, requester } from "./fixtures.js";

/**
 * Context with the fake target loader, the sync and event recorders, and the "Article review"
 * workflow stored. Recorders are empty when it returns.
 */
export const createReviewContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.register(FakeReviewTargetLoader);
            container.register(RecordingReviewTargetSync);
            container.registerDecorator(RecordingEventPublisher);
            await params.setup?.(container);
        }
    });

    const stored = await context.container
        .resolve(StoreWorkflowUseCase)
        .execute({ workflow: createWorkflowValues() });
    if (stored.isFail()) {
        throw stored.error;
    }

    recordedSyncs.length = 0;
    recordedEvents.length = 0;
    callLog.length = 0;

    return {
        context,
        workflow: stored.value
    };
};

export const createRequestInput = (
    overrides: Partial<RequestReviewInput> = {}
): RequestReviewInput => {
    return {
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        picks: [],
        actor: requester,
        ...overrides
    };
};
