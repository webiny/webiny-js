import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsEntry, CmsModel, UpdateCmsEntryInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface EntryBeforeUpdatePayload {
    entry: CmsEntry;
    original: CmsEntry;
    input: UpdateCmsEntryInput;
    model: CmsModel;
}

export interface EntryAfterUpdatePayload {
    entry: CmsEntry;
    original: CmsEntry;
    input: UpdateCmsEntryInput;
    model: CmsModel;
}

/**
 * EntryBeforeUpdateEvent - Published before updating an entry
 */
export class EntryBeforeUpdateEvent extends DomainEvent<EntryBeforeUpdatePayload> {
    eventType = "Cms/Entry/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return EntryBeforeUpdateHandler;
    }
}

export const EntryBeforeUpdateHandler = createAbstraction<IEventHandler<EntryBeforeUpdateEvent>>(
    "EntryBeforeUpdateHandler"
);

export namespace EntryBeforeUpdateHandler {
    export type Interface = IEventHandler<EntryBeforeUpdateEvent>;
    export type Event = EntryBeforeUpdateEvent;
}

/**
 * EntryAfterUpdateEvent - Published after updating an entry
 */
export class EntryAfterUpdateEvent extends DomainEvent<EntryAfterUpdatePayload> {
    eventType = "Cms/Entry/AfterUpdate" as const;

    getHandlerAbstraction() {
        return EntryAfterUpdateHandler;
    }
}

export const EntryAfterUpdateHandler = createAbstraction<IEventHandler<EntryAfterUpdateEvent>>(
    "EntryAfterUpdateHandler"
);

export namespace EntryAfterUpdateHandler {
    export type Interface = IEventHandler<EntryAfterUpdateEvent>;
    export type Event = EntryAfterUpdateEvent;
}
