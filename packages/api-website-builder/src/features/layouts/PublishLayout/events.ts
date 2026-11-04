import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { LayoutAfterPublishEventHandler, LayoutBeforePublishEventHandler } from "./abstractions.js";
import type { LayoutAfterPublishPayload, LayoutBeforePublishPayload } from "./abstractions.js";

// LayoutBeforePublish Event
export class LayoutBeforePublishEvent extends DomainEvent<LayoutBeforePublishPayload> {
    eventType = "layout.beforePublish" as const;

    getHandlerAbstraction() {
        return LayoutBeforePublishEventHandler;
    }
}

// LayoutAfterPublish Event
export class LayoutAfterPublishEvent extends DomainEvent<LayoutAfterPublishPayload> {
    eventType = "layout.afterPublish" as const;

    getHandlerAbstraction() {
        return LayoutAfterPublishEventHandler;
    }
}
