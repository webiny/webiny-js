import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    LayoutAfterDuplicateEventHandler,
    LayoutBeforeDuplicateEventHandler
} from "./abstractions.js";
import type { LayoutAfterDuplicatePayload, LayoutBeforeDuplicatePayload } from "./abstractions.js";

// LayoutBeforeDuplicate Event
export class LayoutBeforeDuplicateEvent extends DomainEvent<LayoutBeforeDuplicatePayload> {
    eventType = "layout.beforeDuplicate" as const;

    getHandlerAbstraction() {
        return LayoutBeforeDuplicateEventHandler;
    }
}

// LayoutAfterDuplicate Event
export class LayoutAfterDuplicateEvent extends DomainEvent<LayoutAfterDuplicatePayload> {
    eventType = "layout.afterDuplicate" as const;

    getHandlerAbstraction() {
        return LayoutAfterDuplicateEventHandler;
    }
}
