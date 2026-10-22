import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsEntry, CmsModel, ICmsEntrySystem } from "~/types/index.js";

export interface EntryUpdateSystemEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    system: Partial<ICmsEntrySystem>;
    model: CmsModel;
}

export class EntryBeforeUpdateSystemEvent extends DomainEvent<EntryUpdateSystemEventPayload> {
    eventType = "Cms/Entry/BeforeUpdateSystem" as const;

    getHandlerAbstraction() {
        return EntryBeforeUpdateSystemEventHandler;
    }
}

/** Hook in before an entry's system keys are updated. */
export const EntryBeforeUpdateSystemEventHandler = createAbstraction<
    IEventHandler<EntryBeforeUpdateSystemEvent>
>("Cms/Entry/BeforeUpdateSystemEventHandler");

export namespace EntryBeforeUpdateSystemEventHandler {
    export type Interface = IEventHandler<EntryBeforeUpdateSystemEvent>;
    export type Event = EntryBeforeUpdateSystemEvent;
}

export class EntryAfterUpdateSystemEvent extends DomainEvent<EntryUpdateSystemEventPayload> {
    eventType = "Cms/Entry/AfterUpdateSystem" as const;

    getHandlerAbstraction() {
        return EntryAfterUpdateSystemEventHandler;
    }
}

/** Hook in after an entry's system keys are updated. */
export const EntryAfterUpdateSystemEventHandler = createAbstraction<
    IEventHandler<EntryAfterUpdateSystemEvent>
>("Cms/Entry/AfterUpdateSystemEventHandler");

export namespace EntryAfterUpdateSystemEventHandler {
    export type Interface = IEventHandler<EntryAfterUpdateSystemEvent>;
    export type Event = EntryAfterUpdateSystemEvent;
}
