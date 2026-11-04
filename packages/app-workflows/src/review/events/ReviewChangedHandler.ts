import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/abstractions.js";
import type { ReviewChangedEvent } from "./ReviewChangedEvent.js";

export const ReviewChangedHandler = createAbstraction<IEventHandler<ReviewChangedEvent>>(
    "Workflows/ReviewChangedHandler"
);

export namespace ReviewChangedHandler {
    export type Interface = IEventHandler<ReviewChangedEvent>;
    export type Event = ReviewChangedEvent;
}
