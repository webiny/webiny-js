import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import {
    RedirectBeforeUpdateEventHandler,
    RedirectAfterUpdateEventHandler
} from "./abstractions.js";
import type { RedirectBeforeUpdatePayload, RedirectAfterUpdatePayload } from "./abstractions.js";

// RedirectBeforeUpdate Event
export class RedirectBeforeUpdateEvent extends DomainEvent<RedirectBeforeUpdatePayload> {
    eventType = "redirect.beforeUpdate" as const;

    getHandlerAbstraction() {
        return RedirectBeforeUpdateEventHandler;
    }
}

// RedirectAfterUpdate Event
export class RedirectAfterUpdateEvent extends DomainEvent<RedirectAfterUpdatePayload> {
    eventType = "redirect.afterUpdate" as const;

    getHandlerAbstraction() {
        return RedirectAfterUpdateEventHandler;
    }
}
