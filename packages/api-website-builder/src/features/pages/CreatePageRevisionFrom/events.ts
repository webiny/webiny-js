import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import {
    PageBeforeCreateRevisionFromEventHandler,
    PageAfterCreateRevisionFromEventHandler
} from "./abstractions.js";
import type {
    PageBeforeCreateRevisionFromPayload,
    PageAfterCreateRevisionFromPayload
} from "./abstractions.js";

// PageBeforeCreateRevisionFrom Event
export class PageBeforeCreateRevisionFromEvent extends DomainEvent<PageBeforeCreateRevisionFromPayload> {
    eventType = "page.beforeCreateRevisionFrom" as const;

    getHandlerAbstraction() {
        return PageBeforeCreateRevisionFromEventHandler;
    }
}

// PageAfterCreateRevisionFrom Event
export class PageAfterCreateRevisionFromEvent extends DomainEvent<PageAfterCreateRevisionFromPayload> {
    eventType = "page.afterCreateRevisionFrom" as const;

    getHandlerAbstraction() {
        return PageAfterCreateRevisionFromEventHandler;
    }
}
