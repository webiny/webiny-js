import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    EntryAfterPublishEventPayload,
    EntryBeforePublishEventPayload,
    EntryPublishErrorEventPayload
} from "./abstractions.js";

/**
 * Before publish entry event
 */
export class EntryBeforePublishEvent extends DomainEvent<EntryBeforePublishEventPayload> {
    eventType = "Cms/Entry/BeforePublish" as const;

    getHandlerAbstraction() {
        return EntryBeforePublishEventHandler;
    }
}

/** Hook into entry lifecycle before an entry is published. */
export const EntryBeforePublishEventHandler = createAbstraction<
    IEventHandler<EntryBeforePublishEvent>
>("EntryBeforePublishEventHandler");

export namespace EntryBeforePublishEventHandler {
    export type Interface = IEventHandler<EntryBeforePublishEvent>;
    export type Event = EntryBeforePublishEvent;
}

/**
 * After publish entry event
 */
export class EntryAfterPublishEvent extends DomainEvent<EntryAfterPublishEventPayload> {
    eventType = "Cms/Entry/AfterPublish" as const;

    getHandlerAbstraction() {
        return EntryAfterPublishEventHandler;
    }
}

/** Hook into entry lifecycle after an entry is published. */
export const EntryAfterPublishEventHandler = createAbstraction<
    IEventHandler<EntryAfterPublishEvent>
>("EntryAfterPublishEventHandler");

export namespace EntryAfterPublishEventHandler {
    export type Interface = IEventHandler<EntryAfterPublishEvent>;
    export type Event = EntryAfterPublishEvent;
}

/**
 * Publish entry error event
 */
export class EntryPublishErrorEvent extends DomainEvent<EntryPublishErrorEventPayload> {
    eventType = "Cms/Entry/PublishError" as const;

    getHandlerAbstraction() {
        return EntryPublishErrorEventHandler;
    }
}

export const EntryPublishErrorEventHandler = createAbstraction<
    IEventHandler<EntryPublishErrorEvent>
>("EntryPublishErrorEventHandler");

export namespace EntryPublishErrorEventHandler {
    export type Interface = IEventHandler<EntryPublishErrorEvent>;
    export type Event = EntryPublishErrorEvent;
}
