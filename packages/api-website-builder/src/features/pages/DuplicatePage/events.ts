import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { PageBeforeDuplicateHandler, PageAfterDuplicateHandler } from "./abstractions.js";
import type { PageBeforeDuplicatePayload, PageAfterDuplicatePayload } from "./abstractions.js";

// PageBeforeDuplicate Event
export class PageBeforeDuplicateEvent extends DomainEvent<PageBeforeDuplicatePayload> {
    eventType = "page.beforeDuplicate" as const;

    getHandlerAbstraction() {
        return PageBeforeDuplicateHandler;
    }
}

// PageAfterDuplicate Event
export class PageAfterDuplicateEvent extends DomainEvent<PageAfterDuplicatePayload> {
    eventType = "page.afterDuplicate" as const;

    getHandlerAbstraction() {
        return PageAfterDuplicateHandler;
    }
}
