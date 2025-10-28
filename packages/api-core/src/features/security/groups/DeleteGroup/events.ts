import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { GroupBeforeDeletePayload, GroupAfterDeletePayload } from "./abstractions.js";

export class GroupBeforeDeleteEvent extends DomainEvent<GroupBeforeDeletePayload> {
    eventType = "group.beforeDelete" as const;

    getHandlerAbstraction() {
        return GroupBeforeDeleteHandler;
    }
}

export const GroupBeforeDeleteHandler = createAbstraction<
    IEventHandler<GroupBeforeDeleteEvent>
>("GroupBeforeDeleteHandler");

export namespace GroupBeforeDeleteHandler {
    export type Interface = IEventHandler<GroupBeforeDeleteEvent>;
    export type Event = GroupBeforeDeleteEvent;
}

export class GroupAfterDeleteEvent extends DomainEvent<GroupAfterDeletePayload> {
    eventType = "group.afterDelete" as const;

    getHandlerAbstraction() {
        return GroupAfterDeleteHandler;
    }
}

export const GroupAfterDeleteHandler = createAbstraction<
    IEventHandler<GroupAfterDeleteEvent>
>("GroupAfterDeleteHandler");

export namespace GroupAfterDeleteHandler {
    export type Interface = IEventHandler<GroupAfterDeleteEvent>;
    export type Event = GroupAfterDeleteEvent;
}
