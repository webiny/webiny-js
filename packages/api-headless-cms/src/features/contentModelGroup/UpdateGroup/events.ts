import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsGroup } from "~/types/index.js";
import type { CmsGroupUpdateInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface GroupBeforeUpdatePayload {
    original: CmsGroup;
    group: CmsGroup;
}

export interface GroupAfterUpdatePayload {
    original: CmsGroup;
    group: CmsGroup;
}

export interface GroupUpdateErrorPayload {
    input: CmsGroupUpdateInput;
    original: CmsGroup;
    group: CmsGroup;
    error: Error;
}

/**
 * GroupBeforeUpdateEvent - Published before updating a group
 */
export class GroupBeforeUpdateEvent extends DomainEvent<GroupBeforeUpdatePayload> {
    eventType = "Cms/Group/BeforeUpdate" as const;

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

/**
 * GroupAfterUpdateEvent - Published after updating a group
 */
export class GroupAfterUpdateEvent extends DomainEvent<GroupAfterUpdatePayload> {
    eventType = "Cms/Group/AfterUpdate" as const;

    getHandlerAbstraction() {
        return GroupAfterUpdateHandler;
    }
}

export const GroupAfterUpdateHandler = createAbstraction<IEventHandler<GroupAfterUpdateEvent>>(
    "GroupAfterUpdateHandler"
);

export namespace GroupAfterUpdateHandler {
    export type Interface = IEventHandler<GroupAfterUpdateEvent>;
    export type Event = GroupAfterUpdateEvent;
}

/**
 * GroupUpdateErrorEvent - Published when update fails
 */
export class GroupUpdateErrorEvent extends DomainEvent<GroupUpdateErrorPayload> {
    eventType = "Cms/Group/UpdateError" as const;

    getHandlerAbstraction() {
        return GroupUpdateErrorHandler;
    }
}

export const GroupUpdateErrorHandler = createAbstraction<IEventHandler<GroupUpdateErrorEvent>>(
    "GroupUpdateErrorHandler"
);

export namespace GroupUpdateErrorHandler {
    export type Interface = IEventHandler<GroupUpdateErrorEvent>;
    export type Event = GroupUpdateErrorEvent;
}
