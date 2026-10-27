import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewStepReachedFact } from "~/domain/review/facts.js";
import type { ReviewEventPayload } from "../shared/events.js";

/**
 * ReviewStepReachedEvent - published after the review is saved.
 */
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
