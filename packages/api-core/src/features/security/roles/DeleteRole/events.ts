import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { RoleBeforeDeletePayload, RoleAfterDeletePayload } from "./abstractions.js";

export class RoleBeforeDeleteEvent extends DomainEvent<RoleBeforeDeletePayload> {
    eventType = "role.beforeDelete" as const;

    getHandlerAbstraction() {
        return RoleBeforeDeleteHandler;
    }
}

export const RoleBeforeDeleteHandler =
    createAbstraction<IEventHandler<RoleBeforeDeleteEvent>>("RoleBeforeDeleteHandler");

export namespace RoleBeforeDeleteHandler {
    export type Interface = IEventHandler<RoleBeforeDeleteEvent>;
    export type Event = RoleBeforeDeleteEvent;
}

export class RoleAfterDeleteEvent extends DomainEvent<RoleAfterDeletePayload> {
    eventType = "role.afterDelete" as const;

    getHandlerAbstraction() {
        return RoleAfterDeleteHandler;
    }
}

export const RoleAfterDeleteHandler =
    createAbstraction<IEventHandler<RoleAfterDeleteEvent>>("RoleAfterDeleteHandler");

export namespace RoleAfterDeleteHandler {
    export type Interface = IEventHandler<RoleAfterDeleteEvent>;
    export type Event = RoleAfterDeleteEvent;
}
