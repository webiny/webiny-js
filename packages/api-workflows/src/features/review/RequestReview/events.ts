import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewRequestedFact } from "~/domain/review/facts.js";
import type { ReviewEventPayload } from "../shared/events.js";

/**
 * ReviewRequestedEvent - published after the review is saved.
 */
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
