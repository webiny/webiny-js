import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { LayoutAfterCreateEventHandler, LayoutBeforeCreateEventHandler } from "./abstractions.js";
import type { LayoutAfterCreatePayload, LayoutBeforeCreatePayload } from "./abstractions.js";

// LayoutBeforeCreate Event
export class LayoutBeforeCreateEvent extends DomainEvent<LayoutBeforeCreatePayload> {
    eventType = "layout.beforeCreate" as const;

    getHandlerAbstraction() {
        return LayoutBeforeCreateEventHandler;
    }
}

// LayoutAfterCreate Event
export class LayoutAfterCreateEvent extends DomainEvent<LayoutAfterCreatePayload> {
    eventType = "layout.afterCreate" as const;

    getHandlerAbstraction() {
        return LayoutAfterCreateEventHandler;
    }
}
