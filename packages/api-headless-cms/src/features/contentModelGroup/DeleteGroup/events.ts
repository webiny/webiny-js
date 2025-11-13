import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsGroup } from "~/types/index.js";

/**
 * Event payloads
 */
export interface GroupBeforeDeletePayload {
    group: CmsGroup;
}

export interface GroupAfterDeletePayload {
    group: CmsGroup;
}

export interface GroupDeleteErrorPayload {
    group: CmsGroup;
    error: Error;
}

/**
 * GroupBeforeDeleteEvent - Published before deleting a group
 */
export class GroupBeforeDeleteEvent extends DomainEvent<GroupBeforeDeletePayload> {
    eventType = "Cms/Group/BeforeDelete" as const;

    getHandlerAbstraction() {
        return GroupBeforeDeleteHandler;
    }
}

export const GroupBeforeDeleteHandler = createAbstraction<IEventHandler<GroupBeforeDeleteEvent>>(
    "GroupBeforeDeleteHandler"
);

export namespace GroupBeforeDeleteHandler {
    export type Interface = IEventHandler<GroupBeforeDeleteEvent>;
    export type Event = GroupBeforeDeleteEvent;
}

/**
 * GroupAfterDeleteEvent - Published after deleting a group
 */
export class GroupAfterDeleteEvent extends DomainEvent<GroupAfterDeletePayload> {
    eventType = "Cms/Group/AfterDelete" as const;

    getHandlerAbstraction() {
        return GroupAfterDeleteHandler;
    }
}

export const GroupAfterDeleteHandler = createAbstraction<IEventHandler<GroupAfterDeleteEvent>>(
    "GroupAfterDeleteHandler"
);

export namespace GroupAfterDeleteHandler {
    export type Interface = IEventHandler<GroupAfterDeleteEvent>;
    export type Event = GroupAfterDeleteEvent;
}

/**
 * GroupDeleteErrorEvent - Published when delete fails
 */
export class GroupDeleteErrorEvent extends DomainEvent<GroupDeleteErrorPayload> {
    eventType = "Cms/Group/DeleteError" as const;

    getHandlerAbstraction() {
        return GroupDeleteErrorHandler;
    }
}

export const GroupDeleteErrorHandler = createAbstraction<IEventHandler<GroupDeleteErrorEvent>>(
    "GroupDeleteErrorHandler"
);

export namespace GroupDeleteErrorHandler {
    export type Interface = IEventHandler<GroupDeleteErrorEvent>;
    export type Event = GroupDeleteErrorEvent;
}
