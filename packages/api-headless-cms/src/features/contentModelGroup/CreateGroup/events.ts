import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsGroup, CmsGroupCreateInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface GroupBeforeCreateEventPayload {
    group: CmsGroup;
}

export interface GroupAfterCreateEventPayload {
    group: CmsGroup;
}

export interface GroupCreateErrorEventPayload {
    input: CmsGroupCreateInput;
    group: CmsGroup;
    error: Error;
}

/**
 * GroupBeforeCreateEvent - Published before creating a group
 */
export class GroupBeforeCreateEventEvent extends DomainEvent<GroupBeforeCreateEventPayload> {
    eventType = "Cms/Group/BeforeCreate" as const;

    getHandlerAbstraction() {
        return GroupBeforeCreateEventHandler;
    }
}

/** Hook into group lifecycle before a group is created. */
export const GroupBeforeCreateEventHandler = createAbstraction<
    IEventHandler<GroupBeforeCreateEventEvent>
>("GroupBeforeCreateEventHandler");

export namespace GroupBeforeCreateEventHandler {
    export type Interface = IEventHandler<GroupBeforeCreateEventEvent>;
    export type Event = GroupBeforeCreateEventEvent;
}

/**
 * GroupAfterCreateEvent - Published after creating a group
 */
export class GroupAfterCreateEvent extends DomainEvent<GroupAfterCreateEventPayload> {
    eventType = "Cms/Group/AfterCreate" as const;

    getHandlerAbstraction() {
        return GroupAfterCreateEventHandler;
    }
}

/** Hook into group lifecycle after a group is created. */
export const GroupAfterCreateEventHandler = createAbstraction<IEventHandler<GroupAfterCreateEvent>>(
    "GroupAfterCreateEventHandler"
);

export namespace GroupAfterCreateEventHandler {
    export type Interface = IEventHandler<GroupAfterCreateEvent>;
    export type Event = GroupAfterCreateEvent;
}

/**
 * GroupCreateErrorEvent - Published when create fails
 */
export class GroupCreateErrorEvent extends DomainEvent<GroupCreateErrorEventPayload> {
    eventType = "Cms/Group/CreateError" as const;

    getHandlerAbstraction() {
        return GroupCreateErrorEventHandler;
    }
}

export const GroupCreateErrorEventHandler = createAbstraction<IEventHandler<GroupCreateErrorEvent>>(
    "GroupCreateErrorEventHandler"
);

export namespace GroupCreateErrorEventHandler {
    export type Interface = IEventHandler<GroupCreateErrorEvent>;
    export type Event = GroupCreateErrorEvent;
}
