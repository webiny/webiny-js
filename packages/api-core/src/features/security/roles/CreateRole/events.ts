import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { RoleBeforeCreatePayload, RoleAfterCreatePayload } from "./abstractions.js";

export class RoleBeforeCreateEvent extends DomainEvent<RoleBeforeCreatePayload> {
    eventType = "role.beforeCreate" as const;

    getHandlerAbstraction() {
        return RoleBeforeCreateEventHandler;
    }
}

/** Hook into role lifecycle before a role is created. */
export const RoleBeforeCreateEventHandler = createAbstraction<IEventHandler<RoleBeforeCreateEvent>>(
    "RoleBeforeCreateEventHandler"
);

export namespace RoleBeforeCreateEventHandler {
    export type Interface = IEventHandler<RoleBeforeCreateEvent>;
    export type Event = RoleBeforeCreateEvent;
}

export class RoleAfterCreateEvent extends DomainEvent<RoleAfterCreatePayload> {
    eventType = "role.afterCreate" as const;

    getHandlerAbstraction() {
        return RoleAfterCreateEventHandler;
    }
}

/** Hook into role lifecycle after a role is created. */
export const RoleAfterCreateEventHandler = createAbstraction<IEventHandler<RoleAfterCreateEvent>>(
    "RoleAfterCreateEventHandler"
);

export namespace RoleAfterCreateEventHandler {
    export type Interface = IEventHandler<RoleAfterCreateEvent>;
    export type Event = RoleAfterCreateEvent;
}
