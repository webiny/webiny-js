import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/index.js";
import type { ServerEntryChangedEvent } from "./ServerEntryChangedEvent.js";
import type { ServerEntryDeletedEvent } from "./ServerEntryDeletedEvent.js";

/**
 * Reacts to an entry created or changed somewhere this tab did not see, such as by the assistant.
 * Separate from `EntryAfterCreateEventHandler` and `EntryAfterUpdateEventHandler`, which follow the
 * admin's own writes and carry the whole entry.
 */
export const ServerEntryChangedEventHandler = createAbstraction<
    IEventHandler<ServerEntryChangedEvent>
>("Cms/ServerEntryChangedEventHandler");

export namespace ServerEntryChangedEventHandler {
    export type Interface = IEventHandler<ServerEntryChangedEvent>;
    export type Event = ServerEntryChangedEvent;
}

/** Reacts to an entry deleted somewhere this tab did not see, such as by the assistant. */
export const ServerEntryDeletedEventHandler = createAbstraction<
    IEventHandler<ServerEntryDeletedEvent>
>("Cms/ServerEntryDeletedEventHandler");

export namespace ServerEntryDeletedEventHandler {
    export type Interface = IEventHandler<ServerEntryDeletedEvent>;
    export type Event = ServerEntryDeletedEvent;
}
