import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { PageBeforeRestoreEventHandler, PageAfterRestoreEventHandler } from "./abstractions.js";
import type { PageBeforeRestorePayload, PageAfterRestorePayload } from "./abstractions.js";

// PageBeforeRestore Event
export class PageBeforeRestoreEvent extends DomainEvent<PageBeforeRestorePayload> {
    eventType = "page.beforeRestore" as const;

    getHandlerAbstraction() {
        return PageBeforeRestoreEventHandler;
    }
}

// PageAfterRestore Event
export class PageAfterRestoreEvent extends DomainEvent<PageAfterRestorePayload> {
    eventType = "page.afterRestore" as const;

    getHandlerAbstraction() {
        return PageAfterRestoreEventHandler;
    }
}
