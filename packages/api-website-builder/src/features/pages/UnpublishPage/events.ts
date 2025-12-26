import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { PageBeforeUnpublishHandler, PageAfterUnpublishHandler } from "./abstractions.js";
import type { PageBeforeUnpublishPayload, PageAfterUnpublishPayload } from "./abstractions.js";

// PageBeforeUnpublish Event
export class PageBeforeUnpublishEvent extends DomainEvent<PageBeforeUnpublishPayload> {
    eventType = "page.beforeUnpublish" as const;

    getHandlerAbstraction() {
        return PageBeforeUnpublishHandler;
    }
}

// PageAfterUnpublish Event
export class PageAfterUnpublishEvent extends DomainEvent<PageAfterUnpublishPayload> {
    eventType = "page.afterUnpublish" as const;

    getHandlerAbstraction() {
        return PageAfterUnpublishHandler;
    }
}
