import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { UserBeforeCreatePayload, UserAfterCreatePayload } from "./abstractions.js";

// Before Create Event
export class UserBeforeCreateEvent extends DomainEvent<UserBeforeCreatePayload> {
    eventType = "user.beforeCreate" as const;

    getHandlerAbstraction() {
        return UserBeforeCreateEventHandler;
    }
}

export const UserBeforeCreateEventHandler = createAbstraction<IEventHandler<UserBeforeCreateEvent>>(
    "UserBeforeCreateEventHandler"
);

export namespace UserBeforeCreateEventHandler {
    export type Interface = IEventHandler<UserBeforeCreateEvent>;
    export type Event = UserBeforeCreateEvent;
}

// After Create Event
export class UserAfterCreateEvent extends DomainEvent<UserAfterCreatePayload> {
    eventType = "user.afterCreate" as const;

    getHandlerAbstraction() {
        return UserAfterCreateEventHandler;
    }
}

export const UserAfterCreateEventHandler = createAbstraction<IEventHandler<UserAfterCreateEvent>>(
    "UserAfterCreateEventHandler"
);

export namespace UserAfterCreateEventHandler {
    export type Interface = IEventHandler<UserAfterCreateEvent>;
    export type Event = UserAfterCreateEvent;
}
