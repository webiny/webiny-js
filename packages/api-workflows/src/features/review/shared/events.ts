import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewStepFailedFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import type { ReviewRequestedEvent } from "../RequestReview/events.js";
import type { ReviewStepApprovedEvent } from "../ApproveReviewStep/events.js";
import type { ReviewApprovedEvent } from "../ApproveReviewStep/events.js";
import type { ReviewStepRejectedEvent } from "../RejectReviewStep/events.js";
import type { ReviewCancelledEvent } from "../CancelReview/events.js";
import type { ReviewStepReassignedEvent } from "../ReassignReviewStep/events.js";
import type { ReviewStepStartedEvent } from "../StartReviewStep/events.js";
import type { ReviewStepTakenOverEvent } from "../TakeOverReviewStep/events.js";
import type { ReviewStepRestartedEvent } from "../RestartReviewStep/events.js";
import type { ReviewStepReachedEvent } from "../ReviewStepReacher/events.js";

/**
 * Every review event carries the persisted review (ids, workflow snapshot, steps) and the fact
 * (actor, step id, from/to state, comment), enough for a later "Workflows" audit app (spec 9.5).
 */
export interface ReviewEventPayload<TFact extends ReviewFact> {
    review: ReviewData;
    fact: TFact;
}

/**
 * ReviewStepFailedEvent - published after the review is saved.
 * The review stays in progress; the step can be restarted, D8.
 */
export class ReviewStepFailedEvent extends DomainEvent<ReviewEventPayload<ReviewStepFailedFact>> {
    eventType = "Workflows/Review/StepFailed" as const;

    getHandlerAbstraction() {
        return ReviewStepFailedEventHandler;
    }
}

export const ReviewStepFailedEventHandler = createAbstraction<IEventHandler<ReviewStepFailedEvent>>(
    "ReviewStepFailedEventHandler"
);

export namespace ReviewStepFailedEventHandler {
    export type Interface = IEventHandler<ReviewStepFailedEvent>;
    export type Event = ReviewStepFailedEvent;
}

/** Every review event, one per `ReviewFact`; `ReviewSaver` publishes them. */
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
