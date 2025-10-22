import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
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

export class GroupAfterDeleteEvent extends DomainEvent<GroupAfterDeletePayload> {
    eventType = "group.afterDelete" as const;

    getHandlerAbstraction() {
        return GroupAfterDeleteHandler;
    }
}

export const GroupAfterDeleteHandler = createAbstraction<
    IEventHandler<GroupAfterDeleteEvent>
>("GroupAfterDeleteHandler");
