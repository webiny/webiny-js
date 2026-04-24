import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { PageBeforeUnpublishEventHandler, PageAfterUnpublishEventHandler } from "./abstractions.js";
import type { PageBeforeUnpublishPayload, PageAfterUnpublishPayload } from "./abstractions.js";

// PageBeforeUnpublish Event
export class PageBeforeUnpublishEvent extends DomainEvent<PageBeforeUnpublishPayload> {
    eventType = "page.beforeUnpublish" as const;

    getHandlerAbstraction() {
        return PageBeforeUnpublishEventHandler;
    }
}

// PageAfterUnpublish Event
export class PageAfterUnpublishEvent extends DomainEvent<PageAfterUnpublishPayload> {
    eventType = "page.afterUnpublish" as const;

    getHandlerAbstraction() {
        return PageAfterUnpublishEventHandler;
    }
}
