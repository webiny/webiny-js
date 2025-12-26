import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { RedirectBeforeMoveHandler, RedirectAfterMoveHandler } from "./abstractions.js";
import type { RedirectBeforeMovePayload, RedirectAfterMovePayload } from "./abstractions.js";

// RedirectBeforeMove Event
export class RedirectBeforeMoveEvent extends DomainEvent<RedirectBeforeMovePayload> {
    eventType = "redirect.beforeMove" as const;

    getHandlerAbstraction() {
        return RedirectBeforeMoveHandler;
    }
}

// RedirectAfterMove Event
export class RedirectAfterMoveEvent extends DomainEvent<RedirectAfterMovePayload> {
    eventType = "redirect.afterMove" as const;

    getHandlerAbstraction() {
        return RedirectAfterMoveHandler;
    }
}
