import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    PageRevisionAfterDeleteEventHandler,
    PageRevisionBeforeDeleteEventHandler
} from "./abstractions.js";
import type {
    PageRevisionAfterDeletePayload,
    PageRevisionBeforeDeletePayload
} from "./abstractions.js";

// PageRevisionBeforeDelete Event
export class PageRevisionBeforeDeleteEvent extends DomainEvent<PageRevisionBeforeDeletePayload> {
    eventType = "page.revision.beforeDelete" as const;

    getHandlerAbstraction() {
        return PageRevisionBeforeDeleteEventHandler;
    }
}

// PageRevisionAfterDelete Event
export class PageRevisionAfterDeleteEvent extends DomainEvent<PageRevisionAfterDeletePayload> {
    eventType = "page.revision.afterDelete" as const;

    getHandlerAbstraction() {
        return PageRevisionAfterDeleteEventHandler;
    }
}
