import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewStepReassignedFact } from "~/domain/review/facts.js";
import type { ReviewEventPayload } from "../shared/events.js";

/**
 * ReviewStepReassignedEvent - published after the review is saved.
 */
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
