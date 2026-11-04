import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { LayoutAfterUpdateEventHandler, LayoutBeforeUpdateEventHandler } from "./abstractions.js";
import type { LayoutAfterUpdatePayload, LayoutBeforeUpdatePayload } from "./abstractions.js";

// LayoutBeforeUpdate Event
export class LayoutBeforeUpdateEvent extends DomainEvent<LayoutBeforeUpdatePayload> {
    eventType = "layout.beforeUpdate" as const;

    getHandlerAbstraction() {
        return LayoutBeforeUpdateEventHandler;
    }
}

// LayoutAfterUpdate Event
export class LayoutAfterUpdateEvent extends DomainEvent<LayoutAfterUpdatePayload> {
    eventType = "layout.afterUpdate" as const;

    getHandlerAbstraction() {
        return LayoutAfterUpdateEventHandler;
    }
}
