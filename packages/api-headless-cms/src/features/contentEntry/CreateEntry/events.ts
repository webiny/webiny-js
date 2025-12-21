import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsEntry, CmsModel, CreateCmsEntryInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface EntryBeforeCreatePayload {
    entry: CmsEntry;
    input: CreateCmsEntryInput;
    model: CmsModel;
}

export interface EntryAfterCreatePayload {
    entry: CmsEntry;
    input: CreateCmsEntryInput;
    model: CmsModel;
}

/**
 * EntryBeforeCreateEvent - Published before creating an entry
 */
export class EntryBeforeCreateEvent extends DomainEvent<EntryBeforeCreatePayload> {
    eventType = "Cms/Entry/BeforeCreate" as const;

    getHandlerAbstraction() {
        return EntryBeforeCreateHandler;
    }
}

export const EntryBeforeCreateHandler = createAbstraction<IEventHandler<EntryBeforeCreateEvent>>(
    "EntryBeforeCreateHandler"
);

export namespace EntryBeforeCreateHandler {
    export type Interface = IEventHandler<EntryBeforeCreateEvent>;
    export type Event = EntryBeforeCreateEvent;
}

/**
 * EntryAfterCreateEvent - Published after creating an entry
 */
export class EntryAfterCreateEvent extends DomainEvent<EntryAfterCreatePayload> {
    eventType = "Cms/Entry/AfterCreate" as const;

    getHandlerAbstraction() {
        return EntryAfterCreateHandler;
    }
}

export const EntryAfterCreateHandler =
    createAbstraction<IEventHandler<EntryAfterCreateEvent>>("EntryAfterCreateHandler");

export namespace EntryAfterCreateHandler {
    export type Interface = IEventHandler<EntryAfterCreateEvent>;
    export type Event = EntryAfterCreateEvent;
}
