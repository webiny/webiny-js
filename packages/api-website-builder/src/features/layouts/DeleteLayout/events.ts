import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { LayoutAfterDeleteEventHandler, LayoutBeforeDeleteEventHandler } from "./abstractions.js";
import type { LayoutAfterDeletePayload, LayoutBeforeDeletePayload } from "./abstractions.js";

// LayoutBeforeDelete Event
export class LayoutBeforeDeleteEvent extends DomainEvent<LayoutBeforeDeletePayload> {
    eventType = "layout.beforeDelete" as const;

    getHandlerAbstraction() {
        return LayoutBeforeDeleteEventHandler;
    }
}

// LayoutAfterDelete Event
export class LayoutAfterDeleteEvent extends DomainEvent<LayoutAfterDeletePayload> {
    eventType = "layout.afterDelete" as const;

    getHandlerAbstraction() {
        return LayoutAfterDeleteEventHandler;
    }
}
