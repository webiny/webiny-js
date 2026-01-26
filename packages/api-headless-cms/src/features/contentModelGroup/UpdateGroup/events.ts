import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { CmsGroup, CmsGroupUpdateInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface GroupBeforeUpdateEventPayload {
    original: CmsGroup;
    group: CmsGroup;
}

export interface GroupAfterUpdateEventPayload {
    original: CmsGroup;
    group: CmsGroup;
}

export interface GroupUpdateErrorEventPayload {
    input: CmsGroupUpdateInput;
    original: CmsGroup;
    group: CmsGroup;
    error: Error;
}

/**
 * GroupBeforeUpdateEvent - Published before updating a group
 */
export class GroupBeforeUpdateEvent extends DomainEvent<GroupBeforeUpdateEventPayload> {
    eventType = "Cms/Group/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return GroupBeforeUpdateEventHandler;
    }
}

export const GroupBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<GroupBeforeUpdateEvent>
>("GroupBeforeUpdateEventHandler");

export namespace GroupBeforeUpdateEventHandler {
    export type Interface = IEventHandler<GroupBeforeUpdateEvent>;
    export type Event = GroupBeforeUpdateEvent;
}

/**
 * GroupAfterUpdateEvent - Published after updating a group
 */
export class GroupAfterUpdateEvent extends DomainEvent<GroupAfterUpdateEventPayload> {
    eventType = "Cms/Group/AfterUpdate" as const;

    getHandlerAbstraction() {
        return GroupAfterUpdateEventHandler;
    }
}

export const GroupAfterUpdateEventHandler = createAbstraction<IEventHandler<GroupAfterUpdateEvent>>(
    "GroupAfterUpdateEventHandler"
);

export namespace GroupAfterUpdateEventHandler {
    export type Interface = IEventHandler<GroupAfterUpdateEvent>;
    export type Event = GroupAfterUpdateEvent;
}

/**
 * GroupUpdateErrorEvent - Published when update fails
 */
export class GroupUpdateErrorEvent extends DomainEvent<GroupUpdateErrorEventPayload> {
    eventType = "Cms/Group/UpdateError" as const;

    getHandlerAbstraction() {
        return GroupUpdateErrorEventHandler;
    }
}

export const GroupUpdateErrorEventHandler = createAbstraction<IEventHandler<GroupUpdateErrorEvent>>(
    "GroupUpdateErrorEventHandler"
);

export namespace GroupUpdateErrorEventHandler {
    export type Interface = IEventHandler<GroupUpdateErrorEvent>;
    export type Event = GroupUpdateErrorEvent;
}
