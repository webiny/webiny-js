import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Event payloads
 */
export interface EntryBeforeUnpublishEventPayload {
    entry: CmsEntry;
    model: CmsModel;
}

export interface EntryAfterUnpublishEventPayload {
    entry: CmsEntry;
    storageEntry: any;
    model: CmsModel;
}

export interface EntryUnpublishErrorEventPayload {
    entry: CmsEntry;
    model: CmsModel;
    error: Error;
}

/**
 * EntryBeforeUnpublishEvent - Published before unpublishing an entry
 */
export class EntryBeforeUnpublishEvent extends DomainEvent<EntryBeforeUnpublishEventPayload> {
    eventType = "Cms/Entry/BeforeUnpublish" as const;

    getHandlerAbstraction() {
        return EntryBeforeUnpublishEventHandler;
    }
}

/** Hook into entry lifecycle before an entry is unpublished. */
export const EntryBeforeUnpublishEventHandler = createAbstraction<
    IEventHandler<EntryBeforeUnpublishEvent>
>("EntryBeforeUnpublishEventHandler");

export namespace EntryBeforeUnpublishEventHandler {
    export type Interface = IEventHandler<EntryBeforeUnpublishEvent>;
    export type Event = EntryBeforeUnpublishEvent;
}

/**
 * EntryAfterUnpublishEvent - Published after unpublishing an entry
 */
export class EntryAfterUnpublishEvent extends DomainEvent<EntryAfterUnpublishEventPayload> {
    eventType = "Cms/Entry/AfterUnpublish" as const;

    getHandlerAbstraction() {
        return EntryAfterUnpublishEventHandler;
    }
}

/** Hook into entry lifecycle after an entry is unpublished. */
export const EntryAfterUnpublishEventHandler = createAbstraction<
    IEventHandler<EntryAfterUnpublishEvent>
>("EntryAfterUnpublishEventHandler");

export namespace EntryAfterUnpublishEventHandler {
    export type Interface = IEventHandler<EntryAfterUnpublishEvent>;
    export type Event = EntryAfterUnpublishEvent;
}

/**
 * EntryUnpublishErrorEvent - Published when unpublish fails
 */
export class EntryUnpublishErrorEvent extends DomainEvent<EntryUnpublishErrorEventPayload> {
    eventType = "Cms/Entry/UnpublishError" as const;

    getHandlerAbstraction() {
        return EntryUnpublishErrorEventHandler;
    }
}

export const EntryUnpublishErrorEventHandler = createAbstraction<
    IEventHandler<EntryUnpublishErrorEvent>
>("EntryUnpublishErrorEventHandler");

export namespace EntryUnpublishErrorEventHandler {
    export type Interface = IEventHandler<EntryUnpublishErrorEvent>;
    export type Event = EntryUnpublishErrorEvent;
}
