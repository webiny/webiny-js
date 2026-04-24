import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    RedirectBeforeCreateEventHandler,
    RedirectAfterCreateEventHandler
} from "./abstractions.js";
import type { RedirectBeforeCreatePayload, RedirectAfterCreatePayload } from "./abstractions.js";

// RedirectBeforeCreate Event
export class RedirectBeforeCreateEvent extends DomainEvent<RedirectBeforeCreatePayload> {
    eventType = "redirect.beforeCreate" as const;

    getHandlerAbstraction() {
        return RedirectBeforeCreateEventHandler;
    }
}

// RedirectAfterCreate Event
export class RedirectAfterCreateEvent extends DomainEvent<RedirectAfterCreatePayload> {
    eventType = "redirect.afterCreate" as const;

    getHandlerAbstraction() {
        return RedirectAfterCreateEventHandler;
    }
}
