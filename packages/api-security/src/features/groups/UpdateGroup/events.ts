import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { GroupBeforeUpdatePayload, GroupAfterUpdatePayload } from "./abstractions.js";

export class GroupBeforeUpdateEvent extends DomainEvent<GroupBeforeUpdatePayload> {
    eventType = "group.beforeUpdate" as const;

    getHandlerAbstraction() {
        return GroupBeforeUpdateHandler;
    }
}

export const GroupBeforeUpdateHandler = createAbstraction<
    IEventHandler<GroupBeforeUpdateEvent>
>("GroupBeforeUpdateHandler");

export class GroupAfterUpdateEvent extends DomainEvent<GroupAfterUpdatePayload> {
    eventType = "group.afterUpdate" as const;

    getHandlerAbstraction() {
        return GroupAfterUpdateHandler;
    }
}

export const GroupAfterUpdateHandler = createAbstraction<
    IEventHandler<GroupAfterUpdateEvent>
>("GroupAfterUpdateHandler");
