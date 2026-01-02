import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Event payloads
 */
export interface EntryBeforeUnpublishPayload {
    entry: CmsEntry;
    model: CmsModel;
}

export interface EntryAfterUnpublishPayload {
    entry: CmsEntry;
    storageEntry: any;
    model: CmsModel;
}

export interface EntryUnpublishErrorPayload {
    entry: CmsEntry;
    model: CmsModel;
    error: Error;
}

/**
 * EntryBeforeUnpublishEvent - Published before unpublishing an entry
 */
export class EntryBeforeUnpublishEvent extends DomainEvent<EntryBeforeUnpublishPayload> {
    eventType = "Cms/Entry/BeforeUnpublish" as const;

    getHandlerAbstraction() {
        return EntryBeforeUnpublishHandler;
    }
}

export const EntryBeforeUnpublishHandler = createAbstraction<
    IEventHandler<EntryBeforeUnpublishEvent>
>("EntryBeforeUnpublishHandler");

export namespace EntryBeforeUnpublishHandler {
    export type Interface = IEventHandler<EntryBeforeUnpublishEvent>;
    export type Event = EntryBeforeUnpublishEvent;
}

/**
 * EntryAfterUnpublishEvent - Published after unpublishing an entry
 */
export class EntryAfterUnpublishEvent extends DomainEvent<EntryAfterUnpublishPayload> {
    eventType = "Cms/Entry/AfterUnpublish" as const;

    getHandlerAbstraction() {
        return EntryAfterUnpublishHandler;
    }
}

export const EntryAfterUnpublishHandler = createAbstraction<
    IEventHandler<EntryAfterUnpublishEvent>
>("EntryAfterUnpublishHandler");

export namespace EntryAfterUnpublishHandler {
    export type Interface = IEventHandler<EntryAfterUnpublishEvent>;
    export type Event = EntryAfterUnpublishEvent;
}

/**
 * EntryUnpublishErrorEvent - Published when unpublish fails
 */
export class EntryUnpublishErrorEvent extends DomainEvent<EntryUnpublishErrorPayload> {
    eventType = "Cms/Entry/UnpublishError" as const;

    getHandlerAbstraction() {
        return EntryUnpublishErrorHandler;
    }
}

export const EntryUnpublishErrorHandler = createAbstraction<
    IEventHandler<EntryUnpublishErrorEvent>
>("EntryUnpublishErrorHandler");

export namespace EntryUnpublishErrorHandler {
    export type Interface = IEventHandler<EntryUnpublishErrorEvent>;
    export type Event = EntryUnpublishErrorEvent;
}
