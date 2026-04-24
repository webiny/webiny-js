import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { RoleBeforeDeletePayload, RoleAfterDeletePayload } from "./abstractions.js";

export class RoleBeforeDeleteEvent extends DomainEvent<RoleBeforeDeletePayload> {
    eventType = "role.beforeDelete" as const;

    getHandlerAbstraction() {
        return RoleBeforeDeleteEventHandler;
    }
}

/** Hook into role lifecycle before a role is deleted. */
export const RoleBeforeDeleteEventHandler = createAbstraction<IEventHandler<RoleBeforeDeleteEvent>>(
    "RoleBeforeDeleteEventHandler"
);

export namespace RoleBeforeDeleteEventHandler {
    export type Interface = IEventHandler<RoleBeforeDeleteEvent>;
    export type Event = RoleBeforeDeleteEvent;
}

export class RoleAfterDeleteEvent extends DomainEvent<RoleAfterDeletePayload> {
    eventType = "role.afterDelete" as const;

    getHandlerAbstraction() {
        return RoleAfterDeleteEventHandler;
    }
}

/** Hook into role lifecycle after a role is deleted. */
export const RoleAfterDeleteEventHandler = createAbstraction<IEventHandler<RoleAfterDeleteEvent>>(
    "RoleAfterDeleteEventHandler"
);

export namespace RoleAfterDeleteEventHandler {
    export type Interface = IEventHandler<RoleAfterDeleteEvent>;
    export type Event = RoleAfterDeleteEvent;
}
