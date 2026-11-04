import { BaseEvent } from "@webiny/app/features/eventPublisher/abstractions.js";
import type { Review } from "~/review/domain/types.js";
import { ReviewChangedHandler } from "./ReviewChangedHandler.js";

export interface ReviewChangedPayload {
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    review: Review | null;
}

export class ReviewChangedEvent extends BaseEvent<ReviewChangedPayload> {
    eventType = "workflows.review.changed" as const;

    getHandlerAbstraction() {
        return ReviewChangedHandler;
    }
}
