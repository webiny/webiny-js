import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    LayoutAfterTranslateEventHandler,
    LayoutBeforeTranslateEventHandler
} from "./abstractions.js";
import type { LayoutAfterTranslatePayload, LayoutBeforeTranslatePayload } from "./abstractions.js";

// LayoutBeforeTranslate Event
export class LayoutBeforeTranslateEvent extends DomainEvent<LayoutBeforeTranslatePayload> {
    eventType = "layout.beforeTranslate" as const;

    getHandlerAbstraction() {
        return LayoutBeforeTranslateEventHandler;
    }
}

// LayoutAfterTranslate Event
export class LayoutAfterTranslateEvent extends DomainEvent<LayoutAfterTranslatePayload> {
    eventType = "layout.afterTranslate" as const;

    getHandlerAbstraction() {
        return LayoutAfterTranslateEventHandler;
    }
}
