import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { RedirectBeforeMoveEventHandler, RedirectAfterMoveEventHandler } from "./abstractions.js";
import type { RedirectBeforeMovePayload, RedirectAfterMovePayload } from "./abstractions.js";

// RedirectBeforeMove Event
export class RedirectBeforeMoveEvent extends DomainEvent<RedirectBeforeMovePayload> {
    eventType = "redirect.beforeMove" as const;

    getHandlerAbstraction() {
        return RedirectBeforeMoveEventHandler;
    }
}

// RedirectAfterMove Event
export class RedirectAfterMoveEvent extends DomainEvent<RedirectAfterMovePayload> {
    eventType = "redirect.afterMove" as const;

    getHandlerAbstraction() {
        return RedirectAfterMoveEventHandler;
    }
}
