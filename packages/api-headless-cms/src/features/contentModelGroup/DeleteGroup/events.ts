import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsGroup } from "~/types/index.js";

/**
 * Event payloads
 */
export interface GroupBeforeDeleteEventPayload {
    group: CmsGroup;
}

export interface GroupAfterDeleteEventPayload {
    group: CmsGroup;
}

export interface GroupDeleteErrorEventPayload {
    group: CmsGroup;
    error: Error;
}

/**
 * GroupBeforeDeleteEvent - Published before deleting a group
 */
export class GroupBeforeDeleteEvent extends DomainEvent<GroupBeforeDeleteEventPayload> {
    eventType = "Cms/Group/BeforeDelete" as const;

    getHandlerAbstraction() {
        return GroupBeforeDeleteEventHandler;
    }
}

export const GroupBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<GroupBeforeDeleteEvent>
>("GroupBeforeDeleteEventHandler");

export namespace GroupBeforeDeleteEventHandler {
    export type Interface = IEventHandler<GroupBeforeDeleteEvent>;
    export type Event = GroupBeforeDeleteEvent;
}

/**
 * GroupAfterDeleteEvent - Published after deleting a group
 */
export class GroupAfterDeleteEvent extends DomainEvent<GroupAfterDeleteEventPayload> {
    eventType = "Cms/Group/AfterDelete" as const;

    getHandlerAbstraction() {
        return GroupAfterDeleteEventHandler;
    }
}

export const GroupAfterDeleteEventHandler = createAbstraction<IEventHandler<GroupAfterDeleteEvent>>(
    "GroupAfterDeleteEventHandler"
);

export namespace GroupAfterDeleteEventHandler {
    export type Interface = IEventHandler<GroupAfterDeleteEvent>;
    export type Event = GroupAfterDeleteEvent;
}

/**
 * GroupDeleteErrorEvent - Published when delete fails
 */
export class GroupDeleteErrorEvent extends DomainEvent<GroupDeleteErrorEventPayload> {
    eventType = "Cms/Group/DeleteError" as const;

    getHandlerAbstraction() {
        return GroupDeleteErrorEventHandler;
    }
}

export const GroupDeleteErrorEventHandler = createAbstraction<IEventHandler<GroupDeleteErrorEvent>>(
    "GroupDeleteErrorEventHandler"
);

export namespace GroupDeleteErrorEventHandler {
    export type Interface = IEventHandler<GroupDeleteErrorEvent>;
    export type Event = GroupDeleteErrorEvent;
}
