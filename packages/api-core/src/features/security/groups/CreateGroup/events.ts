import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { GroupBeforeCreatePayload, GroupAfterCreatePayload } from "./abstractions.js";

export class GroupBeforeCreateEvent extends DomainEvent<GroupBeforeCreatePayload> {
    eventType = "group.beforeCreate" as const;

    getHandlerAbstraction() {
        return GroupBeforeCreateHandler;
    }
}

export const GroupBeforeCreateHandler = createAbstraction<IEventHandler<GroupBeforeCreateEvent>>(
    "GroupBeforeCreateHandler"
);

export namespace GroupBeforeCreateHandler {
    export type Interface = IEventHandler<GroupBeforeCreateEvent>;
    export type Event = GroupBeforeCreateEvent;
}

export class GroupAfterCreateEvent extends DomainEvent<GroupAfterCreatePayload> {
    eventType = "group.afterCreate" as const;

    getHandlerAbstraction() {
        return GroupAfterCreateHandler;
    }
}

export const GroupAfterCreateHandler =
    createAbstraction<IEventHandler<GroupAfterCreateEvent>>("GroupAfterCreateHandler");

export namespace GroupAfterCreateHandler {
    export type Interface = IEventHandler<GroupAfterCreateEvent>;
    export type Event = GroupAfterCreateEvent;
}
