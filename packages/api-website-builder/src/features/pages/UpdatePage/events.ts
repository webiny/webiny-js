import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { PageBeforeUpdateEventHandler, PageAfterUpdateEventHandler } from "./abstractions.js";
import type { PageBeforeUpdatePayload, PageAfterUpdatePayload } from "./abstractions.js";

// PageBeforeUpdate Event
export class PageBeforeUpdateEvent extends DomainEvent<PageBeforeUpdatePayload> {
    eventType = "page.beforeUpdate" as const;

    getHandlerAbstraction() {
        return PageBeforeUpdateEventHandler;
    }
}

// PageAfterUpdate Event
export class PageAfterUpdateEvent extends DomainEvent<PageAfterUpdatePayload> {
    eventType = "page.afterUpdate" as const;

    getHandlerAbstraction() {
        return PageAfterUpdateEventHandler;
    }
}
