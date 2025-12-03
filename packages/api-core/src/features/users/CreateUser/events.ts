import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { UserBeforeCreatePayload, UserAfterCreatePayload } from "./abstractions.js";

// Before Create Event
export class UserBeforeCreateEvent extends DomainEvent<UserBeforeCreatePayload> {
    eventType = "user.beforeCreate" as const;

    getHandlerAbstraction() {
        return UserBeforeCreateHandler;
    }
}

export const UserBeforeCreateHandler =
    createAbstraction<IEventHandler<UserBeforeCreateEvent>>("UserBeforeCreateHandler");

export namespace UserBeforeCreateHandler {
    export type Interface = IEventHandler<UserBeforeCreateEvent>;
    export type Event = UserBeforeCreateEvent;
}

// After Create Event
export class UserAfterCreateEvent extends DomainEvent<UserAfterCreatePayload> {
    eventType = "user.afterCreate" as const;

    getHandlerAbstraction() {
        return UserAfterCreateHandler;
    }
}

export const UserAfterCreateHandler =
    createAbstraction<IEventHandler<UserAfterCreateEvent>>("UserAfterCreateHandler");

export namespace UserAfterCreateHandler {
    export type Interface = IEventHandler<UserAfterCreateEvent>;
    export type Event = UserAfterCreateEvent;
}
