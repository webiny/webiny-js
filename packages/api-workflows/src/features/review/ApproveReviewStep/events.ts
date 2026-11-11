import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewApprovedFact } from "~/domain/review/facts.js";
import type { ReviewStepApprovedFact } from "~/domain/review/facts.js";
import type { ReviewEventPayload } from "../shared/events.js";

/**
 * ReviewStepApprovedEvent - published after the review is saved.
 */
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

/**
 * ReviewApprovedEvent - published after the review is saved. The last step was approved.
 */
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
