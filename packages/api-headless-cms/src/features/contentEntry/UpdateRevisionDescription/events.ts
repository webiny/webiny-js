import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";

/**
 * Event payloads
 */
export interface EntryBeforeUpdateRevisionDescriptionEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    revisionDescription: string | undefined;
    model: CmsModel;
}

export interface EntryAfterUpdateRevisionDescriptionEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    revisionDescription: string | undefined;
    model: CmsModel;
}

/**
 * EntryBeforeUpdateRevisionDescriptionEvent - Published before updating an entry
 */
export class EntryBeforeUpdateRevisionDescriptionEvent extends DomainEvent<EntryBeforeUpdateRevisionDescriptionEventPayload> {
    eventType = "Cms/Entry/BeforeUpdateRevisionDescription" as const;

    getHandlerAbstraction() {
        return EntryBeforeUpdateRevisionDescriptionEventHandler;
    }
}

/** Hook into entry lifecycle before an entry is updated. */
export const EntryBeforeUpdateRevisionDescriptionEventHandler = createAbstraction<
    IEventHandler<EntryBeforeUpdateRevisionDescriptionEvent>
>("Cms/Entry/BeforeUpdateRevisionDescriptionEventHandler");

export namespace EntryBeforeUpdateRevisionDescriptionEventHandler {
    export type Interface = IEventHandler<EntryBeforeUpdateRevisionDescriptionEvent>;
    export type Event = EntryBeforeUpdateRevisionDescriptionEvent;
}

/**
 * EntryAfterUpdateRevisionDescriptionEvent - Published after updating an entry
 */
export class EntryAfterUpdateRevisionDescriptionEvent extends DomainEvent<EntryAfterUpdateRevisionDescriptionEventPayload> {
    eventType = "Cms/Entry/AfterUpdateRevisionDescription" as const;

    getHandlerAbstraction() {
        return EntryAfterUpdateRevisionDescriptionEventHandler;
    }
}

/** Hook into entry lifecycle after an entry is updated. */
export const EntryAfterUpdateRevisionDescriptionEventHandler = createAbstraction<
    IEventHandler<EntryAfterUpdateRevisionDescriptionEvent>
>("Cms/Entry/AfterUpdateRevisionDescriptionEventHandler");

export namespace EntryAfterUpdateRevisionDescriptionEventHandler {
    export type Interface = IEventHandler<EntryAfterUpdateRevisionDescriptionEvent>;
    export type Event = EntryAfterUpdateRevisionDescriptionEvent;
}
