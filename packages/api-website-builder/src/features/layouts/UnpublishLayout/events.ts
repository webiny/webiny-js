import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    LayoutAfterUnpublishEventHandler,
    LayoutBeforeUnpublishEventHandler
} from "./abstractions.js";
import type { LayoutAfterUnpublishPayload, LayoutBeforeUnpublishPayload } from "./abstractions.js";

// LayoutBeforeUnpublish Event
export class LayoutBeforeUnpublishEvent extends DomainEvent<LayoutBeforeUnpublishPayload> {
    eventType = "layout.beforeUnpublish" as const;

    getHandlerAbstraction() {
        return LayoutBeforeUnpublishEventHandler;
    }
}

// LayoutAfterUnpublish Event
export class LayoutAfterUnpublishEvent extends DomainEvent<LayoutAfterUnpublishPayload> {
    eventType = "layout.afterUnpublish" as const;

    getHandlerAbstraction() {
        return LayoutAfterUnpublishEventHandler;
    }
}
