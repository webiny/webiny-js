import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { RedirectBeforeDeleteHandler, RedirectAfterDeleteHandler } from "./abstractions.js";
import type { RedirectBeforeDeletePayload, RedirectAfterDeletePayload } from "./abstractions.js";

// RedirectBeforeDelete Event
export class RedirectBeforeDeleteEvent extends DomainEvent<RedirectBeforeDeletePayload> {
    eventType = "redirect.beforeDelete" as const;

    getHandlerAbstraction() {
        return RedirectBeforeDeleteHandler;
    }
}

// RedirectAfterDelete Event
export class RedirectAfterDeleteEvent extends DomainEvent<RedirectAfterDeletePayload> {
    eventType = "redirect.afterDelete" as const;

    getHandlerAbstraction() {
        return RedirectAfterDeleteHandler;
    }
}
