import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { RoleBeforeUpdatePayload, RoleAfterUpdatePayload } from "./abstractions.js";

export class RoleBeforeUpdateEvent extends DomainEvent<RoleBeforeUpdatePayload> {
    eventType = "role.beforeUpdate" as const;

    getHandlerAbstraction() {
        return RoleBeforeUpdateEventHandler;
    }
}

export const RoleBeforeUpdateEventHandler = createAbstraction<IEventHandler<RoleBeforeUpdateEvent>>(
    "RoleBeforeUpdateEventHandler"
);

export namespace RoleBeforeUpdateEventHandler {
    export type Interface = IEventHandler<RoleBeforeUpdateEvent>;
    export type Event = RoleBeforeUpdateEvent;
}

export class RoleAfterUpdateEvent extends DomainEvent<RoleAfterUpdatePayload> {
    eventType = "role.afterUpdate" as const;

    getHandlerAbstraction() {
        return RoleAfterUpdateEventHandler;
    }
}

export const RoleAfterUpdateEventHandler = createAbstraction<IEventHandler<RoleAfterUpdateEvent>>(
    "RoleAfterUpdateEventHandler"
);

export namespace RoleAfterUpdateEventHandler {
    export type Interface = IEventHandler<RoleAfterUpdateEvent>;
    export type Event = RoleAfterUpdateEvent;
}
