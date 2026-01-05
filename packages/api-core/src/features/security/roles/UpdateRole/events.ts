import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { RoleBeforeUpdatePayload, RoleAfterUpdatePayload } from "./abstractions.js";

export class RoleBeforeUpdateEvent extends DomainEvent<RoleBeforeUpdatePayload> {
    eventType = "role.beforeUpdate" as const;

    getHandlerAbstraction() {
        return RoleBeforeUpdateHandler;
    }
}

export const RoleBeforeUpdateHandler = createAbstraction<IEventHandler<RoleBeforeUpdateEvent>>(
    "RoleBeforeUpdateHandler"
);

export namespace RoleBeforeUpdateHandler {
    export type Interface = IEventHandler<RoleBeforeUpdateEvent>;
    export type Event = RoleBeforeUpdateEvent;
}

export class RoleAfterUpdateEvent extends DomainEvent<RoleAfterUpdatePayload> {
    eventType = "role.afterUpdate" as const;

    getHandlerAbstraction() {
        return RoleAfterUpdateHandler;
    }
}

export const RoleAfterUpdateHandler =
    createAbstraction<IEventHandler<RoleAfterUpdateEvent>>("RoleAfterUpdateHandler");

export namespace RoleAfterUpdateHandler {
    export type Interface = IEventHandler<RoleAfterUpdateEvent>;
    export type Event = RoleAfterUpdateEvent;
}
