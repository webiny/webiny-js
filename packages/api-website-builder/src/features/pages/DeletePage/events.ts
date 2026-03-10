import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { PageBeforeDeleteEventHandler, PageAfterDeleteEventHandler } from "./abstractions.js";
import type { PageBeforeDeletePayload, PageAfterDeletePayload } from "./abstractions.js";

// PageBeforeDelete Event
export class PageBeforeDeleteEvent extends DomainEvent<PageBeforeDeletePayload> {
    eventType = "page.beforeDelete" as const;

    getHandlerAbstraction() {
        return PageBeforeDeleteEventHandler;
    }
}

// PageAfterDelete Event
export class PageAfterDeleteEvent extends DomainEvent<PageAfterDeletePayload> {
    eventType = "page.afterDelete" as const;

    getHandlerAbstraction() {
        return PageAfterDeleteEventHandler;
    }
}
