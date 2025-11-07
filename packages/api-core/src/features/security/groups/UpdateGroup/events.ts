import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { GroupBeforeUpdatePayload, GroupAfterUpdatePayload } from "./abstractions.js";

export class GroupBeforeUpdateEvent extends DomainEvent<GroupBeforeUpdatePayload> {
    eventType = "group.beforeUpdate" as const;

    getHandlerAbstraction() {
        return GroupBeforeUpdateHandler;
    }
}

export const GroupBeforeUpdateHandler = createAbstraction<IEventHandler<GroupBeforeUpdateEvent>>(
    "GroupBeforeUpdateHandler"
);

export namespace GroupBeforeUpdateHandler {
    export type Interface = IEventHandler<GroupBeforeUpdateEvent>;
    export type Event = GroupBeforeUpdateEvent;
}

export class GroupAfterUpdateEvent extends DomainEvent<GroupAfterUpdatePayload> {
    eventType = "group.afterUpdate" as const;

    getHandlerAbstraction() {
        return GroupAfterUpdateHandler;
    }
}

export const GroupAfterUpdateHandler =
    createAbstraction<IEventHandler<GroupAfterUpdateEvent>>("GroupAfterUpdateHandler");

export namespace GroupAfterUpdateHandler {
    export type Interface = IEventHandler<GroupAfterUpdateEvent>;
    export type Event = GroupAfterUpdateEvent;
}
