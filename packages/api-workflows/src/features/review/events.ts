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
    ReviewStepFailedFact,
    ReviewStepReachedFact,
    ReviewStepReassignedFact,
    ReviewStepRejectedFact,
    ReviewStepRestartedFact,
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
// StepReassigned
// ============================================================================

export class ReviewStepReassignedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepReassignedFact>
> {
    eventType = "Workflows/Review/StepReassigned" as const;

    getHandlerAbstraction() {
        return ReviewStepReassignedEventHandler;
    }
}

export const ReviewStepReassignedEventHandler = createAbstraction<
    IEventHandler<ReviewStepReassignedEvent>
>("ReviewStepReassignedEventHandler");

export namespace ReviewStepReassignedEventHandler {
    export type Interface = IEventHandler<ReviewStepReassignedEvent>;
    export type Event = ReviewStepReassignedEvent;
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
// StepFailed (the review stays in progress; the step can be restarted, D8)
// ============================================================================

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

// ============================================================================
// StepRestarted (the failed step is pending again; the caller re-reaches it)
// ============================================================================

export class ReviewStepRestartedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepRestartedFact>
> {
    eventType = "Workflows/Review/StepRestarted" as const;

    getHandlerAbstraction() {
        return ReviewStepRestartedEventHandler;
    }
}

export const ReviewStepRestartedEventHandler = createAbstraction<
    IEventHandler<ReviewStepRestartedEvent>
>("ReviewStepRestartedEventHandler");

export namespace ReviewStepRestartedEventHandler {
    export type Interface = IEventHandler<ReviewStepRestartedEvent>;
    export type Event = ReviewStepRestartedEvent;
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
    | ReviewStepReassignedEvent
    | ReviewStepApprovedEvent
    | ReviewStepRejectedEvent
    | ReviewStepFailedEvent
    | ReviewStepRestartedEvent
    | ReviewCancelledEvent
    | ReviewApprovedEvent;
