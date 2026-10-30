import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewStepRejectedFact } from "~/domain/review/facts.js";
import type { ReviewEventPayload } from "../shared/events.js";

/**
 * ReviewStepRejectedEvent - published after the review is saved.
 * The review is rejected with it, D10.
 */
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
