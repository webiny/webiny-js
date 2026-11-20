import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    LayoutAfterCreateRevisionFromEventHandler,
    LayoutBeforeCreateRevisionFromEventHandler
} from "./abstractions.js";
import type {
    LayoutAfterCreateRevisionFromPayload,
    LayoutBeforeCreateRevisionFromPayload
} from "./abstractions.js";

// LayoutBeforeCreateRevisionFrom Event
export class LayoutBeforeCreateRevisionFromEvent extends DomainEvent<LayoutBeforeCreateRevisionFromPayload> {
    eventType = "layout.beforeCreateRevisionFrom" as const;

    getHandlerAbstraction() {
        return LayoutBeforeCreateRevisionFromEventHandler;
    }
}

// LayoutAfterCreateRevisionFrom Event
export class LayoutAfterCreateRevisionFromEvent extends DomainEvent<LayoutAfterCreateRevisionFromPayload> {
    eventType = "layout.afterCreateRevisionFrom" as const;

    getHandlerAbstraction() {
        return LayoutAfterCreateRevisionFromEventHandler;
    }
}
