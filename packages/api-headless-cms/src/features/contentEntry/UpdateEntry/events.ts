import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { CmsEntry, CmsModel, UpdateCmsEntryInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface EntryBeforeUpdateEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    input: UpdateCmsEntryInput;
    model: CmsModel;
}

export interface EntryAfterUpdateEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    input: UpdateCmsEntryInput;
    model: CmsModel;
}

/**
 * EntryBeforeUpdateEvent - Published before updating an entry
 */
export class EntryBeforeUpdateEvent extends DomainEvent<EntryBeforeUpdateEventPayload> {
    eventType = "Cms/Entry/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return EntryBeforeUpdateEventHandler;
    }
}

export const EntryBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<EntryBeforeUpdateEvent>
>("EntryBeforeUpdateEventHandler");

export namespace EntryBeforeUpdateEventHandler {
    export type Interface = IEventHandler<EntryBeforeUpdateEvent>;
    export type Event = EntryBeforeUpdateEvent;
}

/**
 * EntryAfterUpdateEvent - Published after updating an entry
 */
export class EntryAfterUpdateEvent extends DomainEvent<EntryAfterUpdateEventPayload> {
    eventType = "Cms/Entry/AfterUpdate" as const;

    getHandlerAbstraction() {
        return EntryAfterUpdateEventHandler;
    }
}

export const EntryAfterUpdateEventHandler = createAbstraction<IEventHandler<EntryAfterUpdateEvent>>(
    "EntryAfterUpdateEventHandler"
);

export namespace EntryAfterUpdateEventHandler {
    export type Interface = IEventHandler<EntryAfterUpdateEvent>;
    export type Event = EntryAfterUpdateEvent;
}
