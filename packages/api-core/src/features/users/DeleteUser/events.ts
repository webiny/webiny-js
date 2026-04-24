import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { UserBeforeDeletePayload, UserAfterDeletePayload } from "./abstractions.js";

// Before Delete Event
export class UserBeforeDeleteEvent extends DomainEvent<UserBeforeDeletePayload> {
    eventType = "user.beforeDelete" as const;

    getHandlerAbstraction() {
        return UserBeforeDeleteEventHandler;
    }
}

/** Hook into user lifecycle before a user is deleted. */
export const UserBeforeDeleteEventHandler = createAbstraction<IEventHandler<UserBeforeDeleteEvent>>(
    "UserBeforeDeleteEventHandler"
);

export namespace UserBeforeDeleteEventHandler {
    export type Interface = IEventHandler<UserBeforeDeleteEvent>;
    export type Event = UserBeforeDeleteEvent;
}

// After Delete Event
export class UserAfterDeleteEvent extends DomainEvent<UserAfterDeletePayload> {
    eventType = "user.afterDelete" as const;

    getHandlerAbstraction() {
        return UserAfterDeleteEventHandler;
    }
}

/** Hook into user lifecycle after a user is deleted. */
export const UserAfterDeleteEventHandler = createAbstraction<IEventHandler<UserAfterDeleteEvent>>(
    "UserAfterDeleteEventHandler"
);

export namespace UserAfterDeleteEventHandler {
    export type Interface = IEventHandler<UserAfterDeleteEvent>;
    export type Event = UserAfterDeleteEvent;
}
