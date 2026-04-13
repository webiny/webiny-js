import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { PageBeforeTrashEventHandler, PageAfterTrashEventHandler } from "./abstractions.js";
import type { PageBeforeTrashPayload, PageAfterTrashPayload } from "./abstractions.js";

// PageBeforeTrash Event
export class PageBeforeTrashEvent extends DomainEvent<PageBeforeTrashPayload> {
    eventType = "page.beforeTrash" as const;

    getHandlerAbstraction() {
        return PageBeforeTrashEventHandler;
    }
}

// PageAfterTrash Event
export class PageAfterTrashEvent extends DomainEvent<PageAfterTrashPayload> {
    eventType = "page.afterTrash" as const;

    getHandlerAbstraction() {
        return PageAfterTrashEventHandler;
    }
}
