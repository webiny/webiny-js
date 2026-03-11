import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { PageBeforeCreateEventHandler, PageAfterCreateEventHandler } from "./abstractions.js";
import type { PageBeforeCreatePayload, PageAfterCreatePayload } from "./abstractions.js";

// PageBeforeCreate Event
export class PageBeforeCreateEvent extends DomainEvent<PageBeforeCreatePayload> {
    eventType = "page.beforeCreate" as const;

    getHandlerAbstraction() {
        return PageBeforeCreateEventHandler;
    }
}

// PageAfterCreate Event
export class PageAfterCreateEvent extends DomainEvent<PageAfterCreatePayload> {
    eventType = "page.afterCreate" as const;

    getHandlerAbstraction() {
        return PageAfterCreateEventHandler;
    }
}
