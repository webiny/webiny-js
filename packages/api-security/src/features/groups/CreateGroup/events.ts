import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { GroupBeforeCreatePayload, GroupAfterCreatePayload } from "./abstractions.js";

export class GroupBeforeCreateEvent extends DomainEvent<GroupBeforeCreatePayload> {
    eventType = "group.beforeCreate" as const;

    getHandlerAbstraction() {
        return GroupBeforeCreateHandler;
    }
}

export const GroupBeforeCreateHandler = createAbstraction<
    IEventHandler<GroupBeforeCreateEvent>
>("GroupBeforeCreateHandler");

export class GroupAfterCreateEvent extends DomainEvent<GroupAfterCreatePayload> {
    eventType = "group.afterCreate" as const;

    getHandlerAbstraction() {
        return GroupAfterCreateHandler;
    }
}

export const GroupAfterCreateHandler = createAbstraction<
    IEventHandler<GroupAfterCreateEvent>
>("GroupAfterCreateHandler");
