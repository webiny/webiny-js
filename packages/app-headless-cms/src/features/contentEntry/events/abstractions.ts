import { createAbstraction } from "@webiny/feature/admin";
import type { EntryAfterCreateEvent } from "./EntryAfterCreateEvent.js";
import type { EntryAfterUpdateEvent } from "./EntryAfterUpdateEvent.js";
import type { EntryAfterDeleteEvent } from "./EntryAfterDeleteEvent.js";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/index.js";

export const EntryAfterCreateEventHandler = createAbstraction<IEventHandler<EntryAfterCreateEvent>>(
    "App/EntryAfterCreateEventHandler"
);

export namespace EntryAfterCreateEventHandler {
    export type Interface = IEventHandler<EntryAfterCreateEvent>;
    export type Event = EntryAfterCreateEvent;
}

export const EntryAfterUpdateEventHandler = createAbstraction<IEventHandler<EntryAfterUpdateEvent>>(
    "App/EntryAfterUpdateEventHandler"
);

export namespace EntryAfterUpdateEventHandler {
    export type Interface = IEventHandler<EntryAfterUpdateEvent>;
    export type Event = EntryAfterUpdateEvent;
}

export const EntryAfterDeleteEventHandler = createAbstraction<IEventHandler<EntryAfterDeleteEvent>>(
    "App/EntryAfterDeleteEventHandler"
);

export namespace EntryAfterDeleteEventHandler {
    export type Interface = IEventHandler<EntryAfterDeleteEvent>;
    export type Event = EntryAfterDeleteEvent;
}
