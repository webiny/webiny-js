import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { UserBeforeDeletePayload, UserAfterDeletePayload } from "./abstractions.js";

// Before Delete Event
export class UserBeforeDeleteEvent extends DomainEvent<UserBeforeDeletePayload> {
    eventType = "user.beforeDelete" as const;

    getHandlerAbstraction() {
        return UserBeforeDeleteHandler;
    }
}

export const UserBeforeDeleteHandler =
    createAbstraction<IEventHandler<UserBeforeDeleteEvent>>("UserBeforeDeleteHandler");

export namespace UserBeforeDeleteHandler {
    export type Interface = IEventHandler<UserBeforeDeleteEvent>;
    export type Event = UserBeforeDeleteEvent;
}

// After Delete Event
export class UserAfterDeleteEvent extends DomainEvent<UserAfterDeletePayload> {
    eventType = "user.afterDelete" as const;

    getHandlerAbstraction() {
        return UserAfterDeleteHandler;
    }
}

export const UserAfterDeleteHandler =
    createAbstraction<IEventHandler<UserAfterDeleteEvent>>("UserAfterDeleteHandler");

export namespace UserAfterDeleteHandler {
    export type Interface = IEventHandler<UserAfterDeleteEvent>;
    export type Event = UserAfterDeleteEvent;
}
