import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { RedirectBeforeUpdateHandler, RedirectAfterUpdateHandler } from "./abstractions.js";
import type { RedirectBeforeUpdatePayload, RedirectAfterUpdatePayload } from "./abstractions.js";

// RedirectBeforeUpdate Event
export class RedirectBeforeUpdateEvent extends DomainEvent<RedirectBeforeUpdatePayload> {
    eventType = "redirect.beforeUpdate" as const;

    getHandlerAbstraction() {
        return RedirectBeforeUpdateHandler;
    }
}

// RedirectAfterUpdate Event
export class RedirectAfterUpdateEvent extends DomainEvent<RedirectAfterUpdatePayload> {
    eventType = "redirect.afterUpdate" as const;

    getHandlerAbstraction() {
        return RedirectAfterUpdateHandler;
    }
}
