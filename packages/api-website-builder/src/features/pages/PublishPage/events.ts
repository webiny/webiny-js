import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { PageBeforePublishEventHandler, PageAfterPublishEventHandler } from "./abstractions.js";
import type { PageBeforePublishPayload, PageAfterPublishPayload } from "./abstractions.js";

// PageBeforePublish Event
export class PageBeforePublishEvent extends DomainEvent<PageBeforePublishPayload> {
    eventType = "page.beforePublish" as const;

    getHandlerAbstraction() {
        return PageBeforePublishEventHandler;
    }
}

// PageAfterPublish Event
export class PageAfterPublishEvent extends DomainEvent<PageAfterPublishPayload> {
    eventType = "page.afterPublish" as const;

    getHandlerAbstraction() {
        return PageAfterPublishEventHandler;
    }
}
