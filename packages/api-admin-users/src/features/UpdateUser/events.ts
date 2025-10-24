import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type {
    UserBeforeUpdatePayload,
    UserAfterUpdatePayload
} from "./abstractions.js";

// Before Update Event
export class UserBeforeUpdateEvent extends DomainEvent<UserBeforeUpdatePayload> {
    eventType = "user.beforeUpdate" as const;

    getHandlerAbstraction() {
        return UserBeforeUpdateHandler;
    }
}

export const UserBeforeUpdateHandler = createAbstraction<IEventHandler<UserBeforeUpdateEvent>>(
    "UserBeforeUpdateHandler"
);

export namespace UserBeforeUpdateHandler {
    export type Interface = IEventHandler<UserBeforeUpdateEvent>;
    export type Event = UserBeforeUpdateEvent;
}

// After Update Event
export class UserAfterUpdateEvent extends DomainEvent<UserAfterUpdatePayload> {
    eventType = "user.afterUpdate" as const;

    getHandlerAbstraction() {
        return UserAfterUpdateHandler;
    }
}

export const UserAfterUpdateHandler = createAbstraction<IEventHandler<UserAfterUpdateEvent>>(
    "UserAfterUpdateHandler"
);

export namespace UserAfterUpdateHandler {
    export type Interface = IEventHandler<UserAfterUpdateEvent>;
    export type Event = UserAfterUpdateEvent;
}
