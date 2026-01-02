import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsGroup } from "~/types/index.js";
import type { CmsGroupCreateInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface GroupBeforeCreatePayload {
    group: CmsGroup;
}

export interface GroupAfterCreatePayload {
    group: CmsGroup;
}

export interface GroupCreateErrorPayload {
    input: CmsGroupCreateInput;
    group: CmsGroup;
    error: Error;
}

/**
 * GroupBeforeCreateEvent - Published before creating a group
 */
export class GroupBeforeCreateEvent extends DomainEvent<GroupBeforeCreatePayload> {
    eventType = "Cms/Group/BeforeCreate" as const;

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

/**
 * GroupAfterCreateEvent - Published after creating a group
 */
export class GroupAfterCreateEvent extends DomainEvent<GroupAfterCreatePayload> {
    eventType = "Cms/Group/AfterCreate" as const;

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

/**
 * GroupCreateErrorEvent - Published when create fails
 */
export class GroupCreateErrorEvent extends DomainEvent<GroupCreateErrorPayload> {
    eventType = "Cms/Group/CreateError" as const;

    getHandlerAbstraction() {
        return GroupCreateErrorHandler;
    }
}

export const GroupCreateErrorHandler =
    createAbstraction<IEventHandler<GroupCreateErrorEvent>>("GroupCreateErrorHandler");

export namespace GroupCreateErrorHandler {
    export type Interface = IEventHandler<GroupCreateErrorEvent>;
    export type Event = GroupCreateErrorEvent;
}
