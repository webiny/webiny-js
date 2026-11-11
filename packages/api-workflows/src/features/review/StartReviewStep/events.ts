import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewStepStartedFact } from "~/domain/review/facts.js";
import type { ReviewEventPayload } from "../shared/events.js";

/**
 * ReviewStepStartedEvent - published after the review is saved.
 */
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
