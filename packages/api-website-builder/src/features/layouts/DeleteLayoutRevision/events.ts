import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    LayoutRevisionAfterDeleteEventHandler,
    LayoutRevisionBeforeDeleteEventHandler
} from "./abstractions.js";
import type {
    LayoutRevisionAfterDeletePayload,
    LayoutRevisionBeforeDeletePayload
} from "./abstractions.js";

// LayoutRevisionBeforeDelete Event
export class LayoutRevisionBeforeDeleteEvent extends DomainEvent<LayoutRevisionBeforeDeletePayload> {
    eventType = "layout.revisionBeforeDelete" as const;

    getHandlerAbstraction() {
        return LayoutRevisionBeforeDeleteEventHandler;
    }
}

// LayoutRevisionAfterDelete Event
export class LayoutRevisionAfterDeleteEvent extends DomainEvent<LayoutRevisionAfterDeletePayload> {
    eventType = "layout.revisionAfterDelete" as const;

    getHandlerAbstraction() {
        return LayoutRevisionAfterDeleteEventHandler;
    }
}
