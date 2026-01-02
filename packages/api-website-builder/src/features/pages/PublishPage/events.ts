import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { PageBeforePublishHandler, PageAfterPublishHandler } from "./abstractions.js";
import type { PageBeforePublishPayload, PageAfterPublishPayload } from "./abstractions.js";

// PageBeforePublish Event
export class PageBeforePublishEvent extends DomainEvent<PageBeforePublishPayload> {
    eventType = "page.beforePublish" as const;

    getHandlerAbstraction() {
        return PageBeforePublishHandler;
    }
}

// PageAfterPublish Event
export class PageAfterPublishEvent extends DomainEvent<PageAfterPublishPayload> {
    eventType = "page.afterPublish" as const;

    getHandlerAbstraction() {
        return PageAfterPublishHandler;
    }
}
