import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { PageBeforeDuplicateEventHandler, PageAfterDuplicateEventHandler } from "./abstractions.js";
import type { PageBeforeDuplicatePayload, PageAfterDuplicatePayload } from "./abstractions.js";

// PageBeforeDuplicate Event
export class PageBeforeDuplicateEvent extends DomainEvent<PageBeforeDuplicatePayload> {
    eventType = "page.beforeDuplicate" as const;

    getHandlerAbstraction() {
        return PageBeforeDuplicateEventHandler;
    }
}

// PageAfterDuplicate Event
export class PageAfterDuplicateEvent extends DomainEvent<PageAfterDuplicatePayload> {
    eventType = "page.afterDuplicate" as const;

    getHandlerAbstraction() {
        return PageAfterDuplicateEventHandler;
    }
}
