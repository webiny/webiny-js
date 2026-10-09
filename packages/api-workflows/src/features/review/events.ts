import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewApprovedFact,
    ReviewCancelledFact,
    ReviewFact,
    ReviewRequestedFact,
    ReviewStepApprovedFact,
    ReviewStepReachedFact,
    ReviewStepRejectedFact,
    ReviewStepStartedFact,
    ReviewStepTakenOverFact
} from "~/domain/review/facts.js";

/**
 * Every review event carries the persisted review (ids, workflow snapshot, steps) and the fact
 * (actor, step id, from/to state, comment), enough for a later "Workflows" audit app (spec 9.5).
 */
export interface ReviewEventPayload<TFact extends ReviewFact> {
    review: ReviewData;
    fact: TFact;
}

// ============================================================================
// Requested
// ============================================================================

export class ReviewRequestedEvent extends DomainEvent<ReviewEventPayload<ReviewRequestedFact>> {
    eventType = "Workflows/Review/Requested" as const;

    getHandlerAbstraction() {
        return ReviewRequestedEventHandler;
    }
}

export const ReviewRequestedEventHandler = createAbstraction<IEventHandler<ReviewRequestedEvent>>(
    "ReviewRequestedEventHandler"
);

export namespace ReviewRequestedEventHandler {
    export type Interface = IEventHandler<ReviewRequestedEvent>;
    export type Event = ReviewRequestedEvent;
}

// ============================================================================
// StepReached
// ============================================================================

export class ReviewStepReachedEvent extends DomainEvent<ReviewEventPayload<ReviewStepReachedFact>> {
    eventType = "Workflows/Review/StepReached" as const;

    getHandlerAbstraction() {
        return ReviewStepReachedEventHandler;
    }
}

export const ReviewStepReachedEventHandler = createAbstraction<
    IEventHandler<ReviewStepReachedEvent>
>("ReviewStepReachedEventHandler");

export namespace ReviewStepReachedEventHandler {
    export type Interface = IEventHandler<ReviewStepReachedEvent>;
    export type Event = ReviewStepReachedEvent;
}

// ============================================================================
// StepStarted
// ============================================================================

export class ReviewStepStartedEvent extends DomainEvent<ReviewEventPayload<ReviewStepStartedFact>> {
    eventType = "Workflows/Review/StepStarted" as const;

    getHandlerAbstraction() {
        return ReviewStepStartedEventHandler;
    }
}

export const ReviewStepStartedEventHandler = createAbstraction<
    IEventHandler<ReviewStepStartedEvent>
>("ReviewStepStartedEventHandler");

export namespace ReviewStepStartedEventHandler {
    export type Interface = IEventHandler<ReviewStepStartedEvent>;
    export type Event = ReviewStepStartedEvent;
}

// ============================================================================
// StepTakenOver
// ============================================================================

export class ReviewStepTakenOverEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepTakenOverFact>
> {
    eventType = "Workflows/Review/StepTakenOver" as const;

    getHandlerAbstraction() {
        return ReviewStepTakenOverEventHandler;
    }
}

export const ReviewStepTakenOverEventHandler = createAbstraction<
    IEventHandler<ReviewStepTakenOverEvent>
>("ReviewStepTakenOverEventHandler");

export namespace ReviewStepTakenOverEventHandler {
    export type Interface = IEventHandler<ReviewStepTakenOverEvent>;
    export type Event = ReviewStepTakenOverEvent;
}

// ============================================================================
// StepApproved
// ============================================================================

export class ReviewStepApprovedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepApprovedFact>
> {
    eventType = "Workflows/Review/StepApproved" as const;

    getHandlerAbstraction() {
        return ReviewStepApprovedEventHandler;
    }
}

export const ReviewStepApprovedEventHandler = createAbstraction<
    IEventHandler<ReviewStepApprovedEvent>
>("ReviewStepApprovedEventHandler");

export namespace ReviewStepApprovedEventHandler {
    export type Interface = IEventHandler<ReviewStepApprovedEvent>;
    export type Event = ReviewStepApprovedEvent;
}

// ============================================================================
// StepRejected (the review is rejected with it, D10)
// ============================================================================

export class ReviewStepRejectedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepRejectedFact>
> {
    eventType = "Workflows/Review/StepRejected" as const;

    getHandlerAbstraction() {
        return ReviewStepRejectedEventHandler;
    }
}

export const ReviewStepRejectedEventHandler = createAbstraction<
    IEventHandler<ReviewStepRejectedEvent>
>("ReviewStepRejectedEventHandler");

export namespace ReviewStepRejectedEventHandler {
    export type Interface = IEventHandler<ReviewStepRejectedEvent>;
    export type Event = ReviewStepRejectedEvent;
}

// ============================================================================
// Cancelled
// ============================================================================

export class ReviewCancelledEvent extends DomainEvent<ReviewEventPayload<ReviewCancelledFact>> {
    eventType = "Workflows/Review/Cancelled" as const;

    getHandlerAbstraction() {
        return ReviewCancelledEventHandler;
    }
}

export const ReviewCancelledEventHandler = createAbstraction<IEventHandler<ReviewCancelledEvent>>(
    "ReviewCancelledEventHandler"
);

export namespace ReviewCancelledEventHandler {
    export type Interface = IEventHandler<ReviewCancelledEvent>;
    export type Event = ReviewCancelledEvent;
}

// ============================================================================
// Approved (the last step was approved)
// ============================================================================

export class ReviewApprovedEvent extends DomainEvent<ReviewEventPayload<ReviewApprovedFact>> {
    eventType = "Workflows/Review/Approved" as const;

    getHandlerAbstraction() {
        return ReviewApprovedEventHandler;
    }
}

export const ReviewApprovedEventHandler = createAbstraction<IEventHandler<ReviewApprovedEvent>>(
    "ReviewApprovedEventHandler"
);

export namespace ReviewApprovedEventHandler {
    export type Interface = IEventHandler<ReviewApprovedEvent>;
    export type Event = ReviewApprovedEvent;
}

export type ReviewEvent =
    | ReviewRequestedEvent
    | ReviewStepReachedEvent
    | ReviewStepStartedEvent
    | ReviewStepTakenOverEvent
    | ReviewStepApprovedEvent
    | ReviewStepRejectedEvent
    | ReviewCancelledEvent
    | ReviewApprovedEvent;
