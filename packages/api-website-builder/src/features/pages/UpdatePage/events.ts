import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { PageBeforeUpdateHandler, PageAfterUpdateHandler } from "./abstractions.js";
import type { PageBeforeUpdatePayload, PageAfterUpdatePayload } from "./abstractions.js";

// PageBeforeUpdate Event
export class PageBeforeUpdateEvent extends DomainEvent<PageBeforeUpdatePayload> {
    eventType = "page.beforeUpdate" as const;

    getHandlerAbstraction() {
        return PageBeforeUpdateHandler;
    }
}

// PageAfterUpdate Event
export class PageAfterUpdateEvent extends DomainEvent<PageAfterUpdatePayload> {
    eventType = "page.afterUpdate" as const;

    getHandlerAbstraction() {
        return PageAfterUpdateHandler;
    }
}
