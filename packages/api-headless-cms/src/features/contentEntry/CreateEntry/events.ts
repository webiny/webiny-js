import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { CmsEntry, CmsModel, CreateCmsEntryInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface EntryBeforeCreateEventPayload {
    entry: CmsEntry;
    input: CreateCmsEntryInput;
    model: CmsModel;
}

export interface EntryAfterCreateEventPayload {
    entry: CmsEntry;
    input: CreateCmsEntryInput;
    model: CmsModel;
}

/**
 * EntryBeforeCreateEvent - Published before creating an entry
 */
export class EntryBeforeCreateEvent extends DomainEvent<EntryBeforeCreateEventPayload> {
    eventType = "Cms/Entry/BeforeCreate" as const;

    getHandlerAbstraction() {
        return EntryBeforeCreateEventHandler;
    }
}

/** Hook into entry lifecycle before an entry is created. */
export const EntryBeforeCreateEventHandler = createAbstraction<
    IEventHandler<EntryBeforeCreateEvent>
>("EntryBeforeCreateEventHandler");

export namespace EntryBeforeCreateEventHandler {
    export type Interface = IEventHandler<EntryBeforeCreateEvent>;
    export type Event = EntryBeforeCreateEvent;
}

/**
 * EntryAfterCreateEvent - Published after creating an entry
 */
export class EntryAfterCreateEvent extends DomainEvent<EntryAfterCreateEventPayload> {
    eventType = "Cms/Entry/AfterCreate" as const;

    getHandlerAbstraction() {
        return EntryAfterCreateEventHandler;
    }
}

/** Hook into entry lifecycle after an entry is created. */
export const EntryAfterCreateEventHandler = createAbstraction<IEventHandler<EntryAfterCreateEvent>>(
    "EntryAfterCreateEventHandler"
);

export namespace EntryAfterCreateEventHandler {
    export type Interface = IEventHandler<EntryAfterCreateEvent>;
    export type Event = EntryAfterCreateEvent;
}
