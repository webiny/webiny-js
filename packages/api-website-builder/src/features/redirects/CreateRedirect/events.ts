import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { RedirectBeforeCreateHandler, RedirectAfterCreateHandler } from "./abstractions.js";
import type { RedirectBeforeCreatePayload, RedirectAfterCreatePayload } from "./abstractions.js";

// RedirectBeforeCreate Event
export class RedirectBeforeCreateEvent extends DomainEvent<RedirectBeforeCreatePayload> {
    eventType = "redirect.beforeCreate" as const;

    getHandlerAbstraction() {
        return RedirectBeforeCreateHandler;
    }
}

// RedirectAfterCreate Event
export class RedirectAfterCreateEvent extends DomainEvent<RedirectAfterCreatePayload> {
    eventType = "redirect.afterCreate" as const;

    getHandlerAbstraction() {
        return RedirectAfterCreateHandler;
    }
}
