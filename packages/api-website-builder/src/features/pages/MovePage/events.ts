import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { PageBeforeMoveHandler, PageAfterMoveHandler } from "./abstractions.js";
import type { PageBeforeMovePayload, PageAfterMovePayload } from "./abstractions.js";

// PageBeforeMove Event
export class PageBeforeMoveEvent extends DomainEvent<PageBeforeMovePayload> {
    eventType = "page.beforeMove" as const;

    getHandlerAbstraction() {
        return PageBeforeMoveHandler;
    }
}

// PageAfterMove Event
export class PageAfterMoveEvent extends DomainEvent<PageAfterMovePayload> {
    eventType = "page.afterMove" as const;

    getHandlerAbstraction() {
        return PageAfterMoveHandler;
    }
}
