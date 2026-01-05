import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { RoleBeforeCreatePayload, RoleAfterCreatePayload } from "./abstractions.js";

export class RoleBeforeCreateEvent extends DomainEvent<RoleBeforeCreatePayload> {
    eventType = "role.beforeCreate" as const;

    getHandlerAbstraction() {
        return RoleBeforeCreateHandler;
    }
}

export const RoleBeforeCreateHandler = createAbstraction<IEventHandler<RoleBeforeCreateEvent>>(
    "RoleBeforeCreateHandler"
);

export namespace RoleBeforeCreateHandler {
    export type Interface = IEventHandler<RoleBeforeCreateEvent>;
    export type Event = RoleBeforeCreateEvent;
}

export class RoleAfterCreateEvent extends DomainEvent<RoleAfterCreatePayload> {
    eventType = "role.afterCreate" as const;

    getHandlerAbstraction() {
        return RoleAfterCreateHandler;
    }
}

export const RoleAfterCreateHandler =
    createAbstraction<IEventHandler<RoleAfterCreateEvent>>("RoleAfterCreateHandler");

export namespace RoleAfterCreateHandler {
    export type Interface = IEventHandler<RoleAfterCreateEvent>;
    export type Event = RoleAfterCreateEvent;
}
