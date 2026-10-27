import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewStepRestartedFact } from "~/domain/review/facts.js";
import type { ReviewEventPayload } from "../shared/events.js";

/**
 * ReviewStepRestartedEvent - published after the review is saved.
 * The failed step is pending again; the caller re-reaches it.
 */
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
