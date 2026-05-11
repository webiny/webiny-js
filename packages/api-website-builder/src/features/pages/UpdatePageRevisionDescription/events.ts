import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    PageBeforeUpdateRevisionDescriptionEventHandler,
    PageAfterUpdateRevisionDescriptionEventHandler
} from "./abstractions.js";
import type {
    PageBeforeUpdateRevisionDescriptionPayload,
    PageAfterUpdateRevisionDescriptionPayload
} from "./abstractions.js";

// PageBeforeUpdate Event
export class PageBeforeUpdateRevisionDescriptionEvent extends DomainEvent<PageBeforeUpdateRevisionDescriptionPayload> {
    eventType = "page.beforeUpdateRevisionDescription" as const;

    getHandlerAbstraction() {
        return PageBeforeUpdateRevisionDescriptionEventHandler;
    }
}

// PageAfterUpdate Event
export class PageAfterUpdateRevisionDescriptionEvent extends DomainEvent<PageAfterUpdateRevisionDescriptionPayload> {
    eventType = "page.afterUpdateRevisionDescription" as const;

    getHandlerAbstraction() {
        return PageAfterUpdateRevisionDescriptionEventHandler;
    }
}
