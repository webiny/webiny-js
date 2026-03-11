import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { UserBeforeUpdatePayload, UserAfterUpdatePayload } from "./abstractions.js";

// Before Update Event
export class UserBeforeUpdateEvent extends DomainEvent<UserBeforeUpdatePayload> {
    eventType = "user.beforeUpdate" as const;

    getHandlerAbstraction() {
        return UserBeforeUpdateEventHandler;
    }
}

export const UserBeforeUpdateEventHandler = createAbstraction<IEventHandler<UserBeforeUpdateEvent>>(
    "UserBeforeUpdateEventHandler"
);

export namespace UserBeforeUpdateEventHandler {
    export type Interface = IEventHandler<UserBeforeUpdateEvent>;
    export type Event = UserBeforeUpdateEvent;
}

// After Update Event
export class UserAfterUpdateEvent extends DomainEvent<UserAfterUpdatePayload> {
    eventType = "user.afterUpdate" as const;

    getHandlerAbstraction() {
        return UserAfterUpdateEventHandler;
    }
}

export const UserAfterUpdateEventHandler = createAbstraction<IEventHandler<UserAfterUpdateEvent>>(
    "UserAfterUpdateEventHandler"
);

export namespace UserAfterUpdateEventHandler {
    export type Interface = IEventHandler<UserAfterUpdateEvent>;
    export type Event = UserAfterUpdateEvent;
}
